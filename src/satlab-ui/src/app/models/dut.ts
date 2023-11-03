export interface ISimpleDUT {
  model: string;
  board: string;
  pools: string[];
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
  isConnected: boolean;
  // the status from UFS
  status: string;

  // use this flag in the UI to indicate
  // the dut was deployed and isConnected is false
  // if the dut was deployed before and now is not connected,
  // it can access.
  isAccessible: boolean;

  // this field for enroll dut
  // user need to assign the hostname
  inputHostname?: string;

  // isServoWiredCorrectly: This boolean helps figure out any wrong wiring connections
  //
  // if true: it means DUT is connected with servo and servo is in working condition
  //          or DUT is not connect to network with servo
  // if false: it means DUT is connected with servo but servo is not wired properly
  //           and DUT can't be deployed with this servo
  isServoWiredCorrectly: boolean;
}

/**
 * IFirmwareDUT is a structure contains the information
 * of calling the GRPC `list_connected_duts_firmware`
 */
export interface IFirmwareDUT {
  address: string,
  currentFirmware: string;
  newestFirmware: string;
}

/**
 * IUpdateFirmwareResult is a structure that contains
 * the information of result of updating firmware.
 */
export interface IUpdateFirmwareResult {
  address: string;
  message: string;
}
