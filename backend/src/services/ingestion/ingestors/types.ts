export type ParserBlock = {
    type?: string;
    [key: string]: any;
};

export type ParserResults = {
    success: boolean;
    data: Array<ParserBlock>;
    [k: string]: any;
};