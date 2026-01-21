export const base64toarraybytes = (base64: string):Uint8Array => {
    const binaryStrings = window.atob(base64) //! Decodes the string from base64 to binary string

    const bytes = new Uint8Array(binaryStrings.length)

    for (let i = 0; i < binaryStrings.length; i++)
    {
        bytes[i] = binaryStrings.charCodeAt(i)
    }

    return bytes

}

export const arrayBufferToBase64 = (buffer: Uint8Array): string => {
    let base64str: string = ""


    for (let i = 0; i < buffer.length; i++){
        base64str += String.fromCharCode(buffer[i])
    }

    return window.btoa(base64str)
    
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()


export const stringToBytes = (text: string): Uint8Array => new Uint8Array(encoder.encode(text))
export const bytesToStrings = (buffer: Uint8Array): string => decoder.decode(buffer)

