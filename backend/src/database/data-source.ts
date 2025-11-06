import "reflect-metadata";
import { DataSource } from "typeorm";
import path from "path";
import { Snapshot } from "../models/Snapshot";
import { Device } from "../models/Device";
import { Interface } from "../models/Interface";
import { Transceiver } from "../models/Transceiver";
import { Option } from "../models/Option";
import { app } from "electron";
import { Alarm } from "../models/Alarm";
import { ARPRecord } from "../models/ARPRecord";
import {BfdSession} from "../models/BfdSession";
import {StpConfiguration} from "../models/StpConfiguration";
import {HardwareComponent} from "../models/HardwareComponent";
import {BgpPeer} from "../models/BgpPeer";
import {StorageSummary} from "../models/StorageSummary";
import {CpuUsageSummary} from "../models/CpuUsageSummary";
import {IsisPeer} from "../models/IsisPeer";
import {PatchInfo} from "../models/PatchInfo";
import {IpRoute} from "../models/IpRoute";
import {LicenseInfo} from "../models/LicenseInfo";
import {MplsL2vc} from "../models/MplsL2vc";
import {OspfInterfaceDetail} from "../models/OspfInterfaceDetail";
import {VpnInstance} from "../models/VpnInstance";
import {PhysicalLink} from "../models/PhysicalLink";
import {EthTrunk} from "../models/EthTrunk";
import {Vlan} from "../models/Vlan";
import {PortVlan} from "../models/PortVlan";
import {VxlanTunnel} from "../models/VxlanTunnel";
import {ETrunk} from "../models/ETrunk";
import {InventoryDaughterBoard} from "../models/InventoryDaughterBoard";
import {InventoryPort} from "../models/InventoryPort";


const dbPath = path.join(app.getPath("userData"), "local.db");
const migrationsPath = path.resolve(__dirname, '..', 'migrations', '*.js');

export const AppDataSource = new DataSource({
  type: "better-sqlite3",
  database: dbPath,
  synchronize: false,
  logging: false,
  entities: [
      Snapshot,
      Device,
      Interface,
      Transceiver,
      Option,
      Alarm,
      ARPRecord,
      BfdSession,
      StpConfiguration,
      HardwareComponent,
      BgpPeer,
      StorageSummary,
      CpuUsageSummary,
      IsisPeer,
      PatchInfo,
      IpRoute,
      LicenseInfo,
      MplsL2vc,
      OspfInterfaceDetail,
      VpnInstance,
      PhysicalLink,
      EthTrunk,
      Vlan,
      PortVlan,
      VxlanTunnel,
      ETrunk,
      InventoryDaughterBoard,
      InventoryPort,
  ],
  migrations: [migrationsPath],
});