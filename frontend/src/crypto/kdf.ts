//todo Argon2 logic to derive your keys

import { argon2id } from "hash-wasm";
import { arrayBufferToBase64 } from "./utils";


export interface Keys {
    key_a: string
    key_b: Uint8Array
}

export const generateSalt = (len: number = 16):Uint8Array => {
    const salt = new Uint8Array(len)
    window.crypto.getRandomValues(salt)
    return salt
}

export const makeKeys = async (password: string, salt: Uint8Array): Promise<Keys> => {

    //? salt will be taken from the database or randomly generated using generateSalt

    const raw_bytes = await argon2id({
        password: password,
        salt: salt,
        parallelism: 1,
        iterations: 3,
        memorySize: 65536, // 64 MB
        hashLength: 64,
        outputType: "binary"
    });

    const key_a = raw_bytes.slice(0, 32)
    const key_b = raw_bytes.slice(32, 64)

    
    const hashed_key_a = arrayBufferToBase64(key_a) //? Converts from binary string to base64 string

    return {
        key_a: hashed_key_a,
        key_b: key_b
    }

}