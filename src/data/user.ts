import { getCollections }  from "@/lib/db"
import { ObjectId } from "mongodb";

export const getUserByEmail = async (email: string) => {
    const {users} = await getCollections(); 
    try {
        const user = await users.findOne({email:email});

        return user;
    } catch {
        return null;
    }
}

export const getUserById = async (id: string) => {
    const {users} = await getCollections();
    try {
        const user = await users.findOne({ _id:new ObjectId(id)});

        return user;
    } catch {
        return null;
    }
}