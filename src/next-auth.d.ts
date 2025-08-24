import { User } from "@auth/core/types"
import { JWT } from "@auth/core/jwt"
import { UserRole } from "@prisma/client";

declare module "@auth/core/types" {
    interface User {
        role: UserRole;
        isOAuth: boolean;
    }
}


declare module "@auth/core/jwt" {
    interface JWT {
        role: UserRole;
        isOAuth: boolean;
    }
}
