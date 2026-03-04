import type { GetServerSideProps, NextPage } from "next";

const MerchRedirectPage: NextPage = () => null;

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/products",
      permanent: true,
    },
  };
};

export default MerchRedirectPage;
