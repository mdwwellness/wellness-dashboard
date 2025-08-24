import SettingsPageComponents from "@/components/pages/settings";
import { userColumns } from "@/components/tables/user-column";
import { UserRole } from "@prisma/client";

export default function SettingsPage(){
    return(
        <>
         <SettingsPageComponents columns={userColumns} data={users} />
        </>
    )
}


const users = [
  {
    id: "1a2b3c4d5e",
    name: "Alice Johnson",
    email: "alice.johnson@example.com",
    emailVerified: new Date("2025-08-01T10:15:00Z"),
    image: "https://randomuser.me/api/portraits/women/1.jpg",
    password: "hashed_password_1",
    role: UserRole.DOCTOR
  },
  {
    id: "2b3c4d5e6f",
    name: "null",
    email: "helo@gmail.com",
    emailVerified: new Date("2025-08-01T10:15:00Z"),
    image: "https://randomuser.me/api/portraits/women/1.jpg",
    password: "null",
    role: UserRole.SUPER_ADMIN
  },
  {
    id: "3c4d5e6f7g",
    name: "Carlos Rivera",
    email: "carlos.rivera@example.com",
    emailVerified: new Date("2025-07-20T08:00:00Z"),
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    password: "hashed_password_2",
    role: UserRole.SUPER_ADMIN
  },
  {
    id: "4d5e6f7g8h",
    name: "Emily Chen",
    email: "emily.chen@example.com",
    emailVerified: new Date("2025-08-01T10:15:00Z"),
    image: "https://randomuser.me/api/portraits/women/1.jpg",
    password: "hashed_password_3",
    role: UserRole.DOCTOR
  },
  {
    id: "5e6f7g8h9i",
    name: "null",
    email: "anon@example.com",
    emailVerified: new Date("2025-08-01T10:15:00Z"),
    image:"https://randomuser.me/api/portraits/women/1.jpg",
    password: "hashed_password_4",
    role: UserRole.SUPER_ADMIN
  },
  {
    id: "6f7g8h9i0j",
    name: "Mohammed Ali",
    email: "m.ali@example.com",
    emailVerified: new Date("2025-06-12T14:45:00Z"),
    image: "https://randomuser.me/api/portraits/men/45.jpg",
    password: "hashed_password_5",
    role: UserRole.DOCTOR
  },
  {
    id: "7g8h9i0j1k",
    name: "Sophie Müller",
    email: "sophie.mueller@example.de",
    emailVerified: new Date("2025-08-10T11:30:00Z"),
    image: "https://randomuser.me/api/portraits/women/54.jpg",
    password: "hashed_password_6",
    role: UserRole.SUPER_ADMIN
  },
  {
    id: "8h9i0j1k2l",
    name: "Liam O’Connor",
    email: "liam.oconnor@example.ie",
    emailVerified: new Date("2025-08-01T10:15:00Z"),
    image: "https://randomuser.me/api/portraits/women/1.jpg",
    password: "null",
    role: UserRole.DOCTOR
  },
  {
    id: "9i0j1k2l3m",
    name: "null",
    email: "helo@gmail.com",
    emailVerified: new Date("2025-08-01T10:15:00Z"),
    image: "https://randomuser.me/api/portraits/women/1.jpg",
    password: "null",
    role: UserRole.DOCTOR
  },
  {
    id: "0j1k2l3m4n",
    name: "Haruto Tanaka",
    email: "haruto.tanaka@example.jp",
    emailVerified: new Date("2025-08-13T09:00:00Z"),
    image: "https://randomuser.me/api/portraits/men/77.jpg",
    password: "hashed_password_7",
    role: UserRole.SUPER_ADMIN
  }
];
