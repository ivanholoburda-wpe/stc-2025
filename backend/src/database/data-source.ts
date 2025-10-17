import "reflect-metadata";
import { DataSource } from "typeorm";
import path from "path";
import { Snapshot } from "../models/Snapshot";
import { Device } from "../models/Device";
import { Interface } from "../models/Interface";
import { Transceiver } from "../models/Transceiver";
import { DeviceNeighbor } from "../models/DeviceNeighbor";
import { Option } from "../models/Option";
import { app } from "electron";
import { Alarm } from "../models/Alarm";
import { ARPRecord } from "../models/ARPRecord";


const dbPath = path.join(app.getPath("userData"), "local.db");
const migrationsPath = path.resolve(__dirname, '..', 'migrations', '*.js');;

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: dbPath,
  synchronize: false,
  logging: true,
  entities: [Snapshot, Device, Interface, Transceiver, DeviceNeighbor, Option, Alarm, ARPRecord],
  migrations: [migrationsPath],
});