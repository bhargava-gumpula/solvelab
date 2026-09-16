/**
 * Re-exports brand profiles and keeps older bluetooth-filters import paths working.
 */
export {
  BLUETOOTH_TIMER_BRANDS,
  BLUETOOTH_TIMER_BRAND_IDS,
  buildTimerRequestDeviceOptions,
  getBluetoothTimerBrandProfile,
  decodeQiyiTimerPacket,
  type BluetoothTimerBrand,
  type BluetoothTimerBrandProfile,
} from "./brands";

export {
  GAN_TIMER_SERVICE,
  GAN_TIMER_STATE_CHAR,
  QIYI_TIMER_SERVICE,
  decodeGanSmartTimerPacket,
  decodeGanTimerPacket,
  ganStateToSignal,
  GanState,
  crc16ccitt,
} from "./gan-timer";
