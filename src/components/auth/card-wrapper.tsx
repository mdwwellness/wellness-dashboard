"use client";

import { Card, CardContent, CardFooter } from "../ui/card";
import { Header } from "./header";
import { Social } from "./social";
import BackButton from "./back-button";

type CardWrapperProps = {
  children: React.ReactNode;
  headerLabel: string;
  backButtonLabel: string;
  backButtonHref: string;
  showSocials?: boolean;
};

export const CardWrapper = ({
  children,
  headerLabel,
  backButtonHref,
  backButtonLabel,
  showSocials,
}: CardWrapperProps) => {
  return (
    <Card className="w-[400px]  shadow-md">
      <Header label={headerLabel} />
      <CardContent>{children}</CardContent>
      {/* <CardFooter>
        <Social />
      </CardFooter> */}
      <CardFooter>
        <BackButton
          label={backButtonLabel}
          href={backButtonHref}
        />
      </CardFooter>
    </Card>
  );
};
