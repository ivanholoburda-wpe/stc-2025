declare module 'path' {
  const anyExport: any;
  export = anyExport;
}

declare module 'fs/promises' {
  const anyExport: any;
  export = anyExport;
}

declare module 'fs' {
  const anyExport: any;
  export = anyExport;
}

declare var require: any;

declare module 'typeorm' {
  export const Entity: any;
  export const PrimaryGeneratedColumn: any;
  export const Column: any;
  export const ManyToOne: any;
  export const JoinColumn: any;
  export const OneToMany: any;
  export const DataSource: any;
  export type Repository<T> = any;
  export type DataSource = any;
}


