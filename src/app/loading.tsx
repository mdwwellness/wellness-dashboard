import { Skeleton } from "@/components/ui/skeleton";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const Loading = () => {
  return (
    <div className="flex justify-center items-center h-[100vh]">
      <Card className="h-full w-full"> 
        <CardHeader className="flex flex-row justify-start items-center gap-2">
          <div className="flex flex-col gap-2">
            <CardTitle>
              <Skeleton className="h-4 w-[100px]" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-[250px]" />
            </CardDescription>
          </div>
          <div className="ml-auto flex items-center gap-2 h-3/5">
            <Skeleton className="h-3.5 w-3.5 rounded-full" />
            <Skeleton className="sr-only sm:not-sr-only sm:whitespace-nowrap" />
          </div>
        </CardHeader>
        <CardContent className="w-full h-[80%]">
          <Skeleton className="w-full h-full" />
        </CardContent>
      </Card>
    </div>
  );
};

export default Loading;
