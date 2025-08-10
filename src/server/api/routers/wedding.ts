/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/await-thenable */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// ~/server/api/routers/wedding.ts
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import fetch from "node-fetch";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { type StyleRules, type FontRule, type LineRule, type LayoutRules } from "~/data/types/weddingStyles";
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { env } from "~/env.mjs";
import AWS from "aws-sdk";
import { toWords as toWordsUntyped } from 'number-to-words'; 
const toWords: (n: number) => string = toWordsUntyped;

// --- CONFIGURATION ---
const s3 = new AWS.S3({
  credentials: { accessKeyId: env.ACCESS_KEY_ID, secretAccessKey: env.SECRET_ACCESS_KEY },
  region: "us-east-1",
});
const BUCKET_NAME = "name-design-ai";

// --- HELPER FUNCTIONS ---
function escapeXml(unsafe: string): string {
  if (typeof unsafe !== 'string') return '';
  return unsafe.replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c as never] || c));
}

// --- THE MAIN ROUTER ---
export const weddingRouter = createTRPCRouter({
  generateInvitation: protectedProcedure
    .input(z.object({
      prompt: z.string(),
      model: z.enum([ "flux-kontext-pro", "flux-kontext-max" ]),
      referenceImageUrl: z.string(),
      userImageUrl: z.string().url().or(z.literal("")).optional(),
      isHybridGeneration: z.boolean(),
      brideName: z.string(), groomName: z.string(),
      weddingDate: z.string(), weddingTime: z.string(),
      venueName: z.string(), venueAddress: z.string(),
      styleRules: z.custom<StyleRules>(),
      receptionOption: z.string().optional(),
      receptionVenue: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const creditsNeeded = 10; // Stage 1 cost
      const { count } = await ctx.prisma.user.updateMany({
          where: { id: ctx.session.user.id, credits: { gte: creditsNeeded } },
          data: { credits: { decrement: creditsNeeded } },
      });
      if (count <= 0) { throw new TRPCError({ code: "BAD_REQUEST", message: "You do not have enough credits" }); }
      
      let finalImageBuffer: Buffer;

      if (input.isHybridGeneration) {
        // --- THIS IS THE CORRECT, FINAL "HYBRID PUPPETEER" PATH ---
        let baseImageBuffer: Buffer;
        
        const { fonts, elements, lines } = input.styleRules;
        if (!fonts || !elements) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Style rules are incomplete." });

        if (input.styleRules.photo && input.userImageUrl) {
            const backgroundPath = path.join(process.cwd(), 'public', input.referenceImageUrl);
            const backgroundBuffer = fs.readFileSync(backgroundPath);
            const photoRules = input.styleRules.photo;
            const userPhotoBuffer = await (await fetch(input.userImageUrl)).buffer();
            const resizedPhoto = await sharp(userPhotoBuffer).resize(photoRules.width, photoRules.height, { fit: 'cover' }).toBuffer();
            baseImageBuffer = await sharp(resizedPhoto).composite([{ input: backgroundBuffer, top: 0, left: 0 }]).png().toBuffer();
        } else {
            const backgroundPath = path.join(process.cwd(), 'public', input.referenceImageUrl);
            baseImageBuffer = fs.readFileSync(backgroundPath);
        }
        
        const backgroundImageDataUrl = `data:image/png;base64,${baseImageBuffer.toString('base64')}`;
        
        const fontFaces = (Object.values(fonts)).map((font) => {
          const fontPath = path.join(process.cwd(), 'public', 'fonts', font.file);
          const fontBase64 = fs.readFileSync(fontPath).toString('base64');
          return `@font-face { font-family: '${escapeXml(font.family)}'; src: url(data:font/ttf;base64,${fontBase64}) format('truetype'); }`;
        }).join('\n');
        
        const date = new Date(`${input.weddingDate}T${input.weddingTime || '00:00'}:00Z`);
        const formattedDate = '';
        const formatting = input.styleRules.formatting;
        const day = date.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'UTC' });
        const monthFormat: "numeric" | "2-digit" | "long" | "short" | "narrow" = formatting?.dateFormat?.month ?? "long";
        const month = date.toLocaleDateString('en-US', { month: monthFormat, timeZone: 'UTC' }).toUpperCase();
        const year = date.toLocaleDateString('en-US', { year: 'numeric', timeZone: 'UTC' });
        const weekdayFormat: "long" | "short" | "narrow" | undefined = formatting?.dateFormat?.weekday;
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: weekdayFormat ?? 'long', timeZone: 'UTC' }).toUpperCase();
        const fullDate = `${dayOfWeek}, ${day}TH ${month}`;
        const classicDate = `${day}th · ${month} · ${year}`;
        const pastelDate = `${day}th ${month}`;
        const MaxDate = `${dayOfWeek}, ${day} ${month} ${year}`;
        const navyDate = `${day} . ${month} . ${year}`;
        let formattedTime = '';
        if (input.weddingTime) {
            // Check the rule from the data file
            if (formatting?.timeFormat === 'words') {
                const hour = date.getUTCHours();
                const minute = date.getUTCMinutes();
                const hourWord = toWords(hour % 12 === 0 ? 12 : hour % 12);
                const minuteWord = minute === 0 ? "o'clock" : toWords(minute);
                const period = hour >= 12 ? "in the afternoon" : "in the morning";
                formattedTime = `${hourWord} ${minuteWord} ${period}`;
                formattedTime = formattedTime.charAt(0).toUpperCase() + formattedTime.slice(1);
            } else {
                // Default to the AM/PM format
                const timeString = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' });
                formattedTime = `AT ${timeString}`;
            }
        }
        

        const textData: { [key: string]: string } = {
          headline: elements.headline?.content ?? '', day, month, year, time: formattedTime, date: formattedDate, fullDate: fullDate, navyDate: navyDate,
          brideName: input.brideName ?? '', groomName: input.groomName ?? '', classicDate: classicDate, pastelDate: pastelDate, MaxDate: MaxDate,
          venue: input.venueName ?? '', address: input.venueAddress ?? '', reception: input.receptionOption === 'none' ? '' :
            input.receptionOption === 'sameLocation' ? "Reception to follow" :
            input.receptionOption === 'differentLocation' ? (input.receptionVenue ?? '') :
            '', dayOfWeek: dayOfWeek,
        };
        
        const textElements = (Object.keys(elements) as Array<keyof LayoutRules>).map(key => {
            const rules = elements[key];
            const content = textData[key];
            if (!rules || content === undefined) return '';
            const fontKey = rules.fontFamily as keyof typeof fonts | undefined ?? 'body';
            const font = fonts[fontKey];
            if (!font) return '';
            return `<text x="${rules.x ?? 512}" y="${rules.y}" style="font-family:'${font.family}'; font-size:${rules.fontSize}px; fill:${rules.color}; letter-spacing:${rules.letterSpacing ?? 0}px; text-transform:${rules.textTransform ?? 'none'}; font-weight:${rules.fontWeight ?? 'normal'}; text-anchor:middle;">${content}</text>`;
        }).join('\n');
        
        const lineElements = lines ? (Object.values(lines)).map(line => 
            `<line x1="300" y1="${line.y1}" x2="724" y2="${line.y2}" stroke="${line.stroke}" stroke-width="${line.strokeWidth}" />`
        ).join('\n') : '';

        const finalSvgString = `
          <svg width="1024" height="1434" xmlns="http://www.w3.org/2000/svg">
            <style>${fontFaces}</style>
            <image href="${backgroundImageDataUrl}" x="0" y="0" width="1024" height="1434" />
            ${textElements}
            ${lineElements}
          </svg>
        `;
        
        try {
            const browser = await puppeteer.launch({
              args: chromium.args,
              defaultViewport: null, // Puppeteer will use your own setViewport later
              executablePath:
                process.env.NODE_ENV === "development"
                  ? (await import("puppeteer")).executablePath() // Local full Puppeteer
                  : await chromium.executablePath(), // Vercel / serverless
              headless: true, // chromium.headless is no longer provided
            });
            const page = await browser.newPage();
            await page.setViewport({ width: 1024, height: 1434, deviceScaleFactor: 2 });
            await page.setContent(finalSvgString, { waitUntil: 'domcontentloaded' });
            const screenshotData = await page.screenshot({ omitBackground: true });
            await browser.close();
            finalImageBuffer = Buffer.from(screenshotData);
        } catch (err) {
            console.error("❌ PUPPETEER ERROR:", err);
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to render invitation image." });
        }
      } else {
        // This is the AI enhancement path, which now correctly resides in enhancement.ts
        throw new TRPCError({ code: "BAD_REQUEST", message: "This procedure is only for hybrid generation." });
      }
          
      const icon = await ctx.prisma.icon.create({
        data: { prompt: input.prompt, userId: ctx.session.user.id },
      });
      await s3.putObject({
        Bucket: BUCKET_NAME, Body: finalImageBuffer, Key: icon.id, ContentType: 'image/png',
      }).promise();
      
      return [{ imageUrl: `https://${BUCKET_NAME}.s3.us-east-1.amazonaws.com/${icon.id}` }];
    }),
});