
import {stringToBytes, arrayBufferToBase64, base64toarraybytes, bytesToStrings} from './utils'

const importKey = async (rawKey: Uint8Array): Promise<CryptoKey> => {
    return window.crypto.subtle.importKey(
        "raw",
        rawKey as BufferSource,
        {name: "AES-GCM"},
        false,
        ["encrypt", "decrypt"]
    )
}

//! sent to the servere. user_id is added in the backend function
interface EncryptedPayload {
    encrypted_data: string;
    nonce_b64: string;
}

// ! received from server
interface SecretVault {
    encrypted_data: string;
    nonce_b64: string;
    version?: number;
}

export const encryptVault = async (jsonData: any, keyB: Uint8Array): Promise<EncryptedPayload> => {

    const jsonstring: string = JSON.stringify(jsonData)
    const data_bytes: Uint8Array = stringToBytes(jsonstring)

    const nonce = new Uint8Array(12)
    window.crypto.getRandomValues(nonce)

    const key = await importKey(keyB)

    try{
        const encrypted_raw = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: nonce 
            },
            key,
            data_bytes as BufferSource
        )

        const encrypted_8bit = new Uint8Array(encrypted_raw)
        const encrypted_data = arrayBufferToBase64(encrypted_8bit)
        const nonce_b64 = arrayBufferToBase64(new Uint8Array(nonce))

        return {
            encrypted_data: encrypted_data,
            nonce_b64: nonce_b64
        }
    }
    catch(error){
        console.error("Something went wrong", error)

        throw new Error("Encryption failed: Invalid key or corrupted data")
    }
    

}

export const decryptVault = async (data:SecretVault, keyB: Uint8Array) => {

    const encrypted_8bit = base64toarraybytes(data.encrypted_data)
    const nonce = (base64toarraybytes(data.nonce_b64))

    const key = await importKey(keyB)

    try{
        const decrypted_raw = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: nonce as BufferSource
            },
            key,
            encrypted_8bit as BufferSource
        )
        const jsonString = bytesToStrings(new Uint8Array(decrypted_raw))
        const jsonData = JSON.parse(jsonString)
    
        return jsonData
    }
    catch(error){
        console.error("There is an error in decryptVault", error)
        throw new Error("Decryption failed: Invalid key or corrupted data")
    }
    


}