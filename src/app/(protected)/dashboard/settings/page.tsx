import { getAllUsers } from "@/actions/get-all-users";
import SettingsPageComponents from "@/components/pages/settings";
import { userColumns } from "@/components/tables/user-column";

export default async function SettingsPage(){
    const users = await getAllUsers()
    return(
        <>
         <SettingsPageComponents columns={userColumns} data={users} />
        </>
    )
}