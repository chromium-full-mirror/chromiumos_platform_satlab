export interface ISimpleDUT {
  hostname: string;
  model: string;
  board: string;
  pools: string[];
  dlmSkuID?: string;
}

export interface IDut {
  address: string;
  name: string;
  hostname: string;
  board: string;
  model: string;
  pools: string[];
  poolString: string;
  mac: string;
  servoSerial?: string;

  // isMauiOnly is for a DUT connected via Maui cable only.
  // Such a DUT has no ethernet connection, so it cannot be `isConnected`.
  isMauiOnly: boolean;

  isConnected: boolean;
  hasTestImage: boolean;
  hasAndroidDesktopImage: boolean;

  // the status from UFS
  status: string;

  // use this flag in the UI to indicate
  // the dut was deployed and isConnected is false
  // if the dut was deployed before and now is not connected,
  // it can access.
  isAccessible: boolean;

  // this field for enroll dut
  // user need to assign the hostname, board, and model if needed
  inputHostname?: string;
  inputBoard?: string;
  inputModel?: string;

  // isServoWiredCorrectly: This boolean helps figure out any wrong wiring connections
  //
  // if true: it means DUT is connected with servo and servo is in working condition
  //          or DUT is not connect to network with servo
  // if false: it means DUT is connected with servo but servo is not wired properly
  //           and DUT can't be deployed with this servo
  isServoWiredCorrectly: boolean;

  // this field is used for status hint text
  statusHintText: string;

  ccdStatus: string;

  testlabEnabled: string;

  dimensions: Object;

  hasPermission: boolean;
}

/**
 * IFirmwareDUT is a structure contains the information
 * of calling the GRPC `list_connected_duts_firmware`
 */
export interface IFirmwareDUT {
  address: string;
  currentFirmware: string;
  newestFirmware: string;
  isLatest: boolean;
}

/**
 * IUpdateFirmwareResult is a structure that contains
 * the information of result of updating firmware.
 */
export interface IUpdateFirmwareResult {
  address: string;
  message: string;
}

export interface RepairDUTResponse {
  hostname: string;
  buildLink: string;
  taskLink: string;
  isSuccess: boolean;
}

/**
 * dutKey returns a stable identity for a DUT, readable enough to show to the
 * user.
 *
 * Enrolled DUTs are identified by hostname, because DUTs without a DNS record
 * share an empty address and would otherwise collide. An un-enrolled DUT has no
 * hostname yet, so it is identified by its address, and one attached only over
 * a Maui cable has no address either, so it falls back to the cable serial.
 */
export function dutKey(d: IDut): string {
  return d.hostname || d.address || d.servoSerial || '';
}
