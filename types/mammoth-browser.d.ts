// mammoth ships a browserified bundle with no type declarations of its own.
declare module "mammoth/mammoth.browser" {
  export interface MammothMessage {
    type: string;
    message: string;
  }
  export interface MammothResult {
    value: string;
    messages: MammothMessage[];
  }
  export function extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<MammothResult>;
  const mammoth: { extractRawText: typeof extractRawText };
  export default mammoth;
}
