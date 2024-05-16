export interface QueryGetRecord {
	id: string;
	table: string;
	database: string;
}

export interface QuerySaveVar {
	varName: string;
	varObj: object;
	database: string;
	table: string;
}

export interface ObjectLiteral {
	[key: string]: any;
}
