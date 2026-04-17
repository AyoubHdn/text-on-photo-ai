import clsx from "clsx";
import Link, {type LinkProps } from "next/link";
import {type ReactNode } from "react";

export function PrimaryLinkButton(
    props: LinkProps & { children: ReactNode; className?: string; id?: string}
) {
    const {className, ...propsWithoutClassname} = props;
    return (
        <Link 
            className={clsx("rounded bg-brand-600 px-4 py-2 text-white hover:bg-brand-700",props.className ?? "")}
            {...propsWithoutClassname}>
            {props.children}
        </Link>
    );
}   