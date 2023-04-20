export function textEncode(content: string): string {
    const encoder = new TextEncoder();
    return btoa(encoder.encode(content));
}
