import type { GetServerSideProps } from "next";

const LegacyListenerRoute = () => null;

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: "/listen",
    permanent: true,
  },
});

export default LegacyListenerRoute;
