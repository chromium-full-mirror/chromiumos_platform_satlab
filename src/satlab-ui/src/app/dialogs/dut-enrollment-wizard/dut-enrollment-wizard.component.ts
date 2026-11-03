import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {IDut} from 'app/models/dut';
import {OS} from 'app/models/run_suite_fields';
import {SelectableItem} from 'app/models/selectable_item';
import {NotificationService} from 'app/services/notification.service';
import {SatlabRpcService} from 'app/services/satlab-rpc.service';
import {OpenCCDReply} from 'app/services/satlabrpc_pb';
import {ClientReadableStream} from 'grpc-web';
import {BehaviorSubject} from 'rxjs';

export interface UnassignedServoOption {
  serial: string;
  deviceType: string;
  hasGscSibling: boolean;
}

export interface ReadinessCheckItem {
  name: string;
  passed: boolean;
  details: string;
  hint: string;
}

export type VerificationStatus =
  | 'pending'
  | 'running'
  | 'pass'
  | 'fail'
  | 'skipped';

@Component({
  selector: 'app-dut-enrollment-wizard',
  templateUrl: './dut-enrollment-wizard.component.html',
  styleUrls: ['./dut-enrollment-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class DutEnrollmentWizardComponent implements OnInit, OnDestroy {
  protected readonly MAX_FULL_HOSTNAME_LENGTH = 32;

  protected hostnamePrefix = '';
  protected existingDuts: IDut[] = [];

  protected loading = new BehaviorSubject<{show: boolean; message: string}>({
    show: false,
    message: '',
  });
  protected loading$ = this.loading.asObservable();

  // 1. Servo selection
  protected servos: UnassignedServoOption[] = [];
  protected selectedServoSerial = '';
  protected isScanningServos = false;

  // 2. Hostname, Asset, Pools
  protected hostnameInput = '';
  protected assetInput = '';
  protected availablePools: string[] = [];
  protected selectedPools: string[] = [];
  protected newPoolInput = '';

  // 3. OS, Board, Model
  protected os: OS = 'chromeos';
  protected board = '';
  protected model = '';
  protected boardOptions: SelectableItem[] = [];
  protected modelOptions: SelectableItem[] = [];
  protected loadingBoards = false;
  protected loadingModels = false;

  // 4. Verification (CCD, GBB, USB drive)
  protected rmaAuth = false;
  protected rmaCode = '';
  protected isVerifying = false;
  protected isCcdStreaming = false;
  protected verificationCompleted = false;
  protected verificationReady = false;
  protected ccdStatus: VerificationStatus = 'pending';
  protected gbbStatus: VerificationStatus = 'pending';
  protected usbStatus: VerificationStatus = 'pending';
  protected checks: ReadinessCheckItem[] = [];
  protected consoleLogs = '';

  // 5. Enrollment state
  protected isEnrolling = false;
  protected enrollError = '';

  private stream?: ClientReadableStream<OpenCCDReply>;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    data: {hostnamePrefix?: string; DUTs?: IDut[]},
    private dialogRef: MatDialogRef<DutEnrollmentWizardComponent>,
    private service: SatlabRpcService,
    private notification: NotificationService,
    private cdr: ChangeDetectorRef
  ) {
    this.hostnamePrefix = data?.hostnamePrefix ?? '';
    this.existingDuts = data?.DUTs ?? [];
    this.initPools();
  }

  ngOnInit(): void {
    this.scanServos();
    this.loadBoards();
  }

  ngOnDestroy(): void {
    this.stream?.cancel();
  }

  protected get maxHostnameSuffixLength(): number {
    return Math.max(
      1,
      this.MAX_FULL_HOSTNAME_LENGTH - this.hostnamePrefix.length
    );
  }

  protected get fullHostname(): string {
    const trimmed = this.hostnameInput.trim();
    if (!trimmed) {
      return '';
    }
    if (this.hostnamePrefix && trimmed.startsWith(this.hostnamePrefix)) {
      return trimmed;
    }
    return `${this.hostnamePrefix}${trimmed}`;
  }

  protected get hostnameError(): string {
    const trimmed = this.hostnameInput.trim();
    if (!trimmed) {
      return '';
    }
    if (!/^[a-z0-9-]+$/.test(trimmed)) {
      return 'Hostname must only contain lowercase letters (a-z), digits (0-9), and hyphens (-).';
    }
    const full = this.fullHostname;
    if (full.length > this.MAX_FULL_HOSTNAME_LENGTH) {
      return `Full hostname (${full.length} chars) exceeds maximum of ${this.MAX_FULL_HOSTNAME_LENGTH} characters.`;
    }
    const isDuplicate = this.existingDuts.some(
      d => d.hostname !== '' && d.hostname === full
    );
    if (isDuplicate) {
      return `Hostname "${full}" is already enrolled.`;
    }
    return '';
  }

  protected get selectedServo(): UnassignedServoOption | undefined {
    return this.servos.find(s => s.serial === this.selectedServoSerial);
  }

  protected get isServoMissingGsc(): boolean {
    const s = this.selectedServo;
    return !!s && !s.hasGscSibling;
  }

  protected get isServoReady(): boolean {
    const s = this.selectedServo;
    return !!s && s.hasGscSibling;
  }

  protected get fieldsDisabled(): boolean {
    return this.isEnrolling || this.isServoMissingGsc;
  }

  protected get selectedDeviceType(): string {
    return this.selectedServo?.deviceType || 'servo';
  }

  protected get canVerify(): boolean {
    return (
      !this.isVerifying &&
      !this.isEnrolling &&
      this.isServoReady &&
      this.hostnameInput.trim() !== '' &&
      this.hostnameError === '' &&
      this.board.trim() !== '' &&
      this.model.trim() !== ''
    );
  }

  protected get canEnroll(): boolean {
    return (
      !this.isVerifying &&
      !this.isEnrolling &&
      this.isServoReady &&
      this.hostnameInput.trim() !== '' &&
      this.hostnameError === '' &&
      this.board.trim() !== '' &&
      this.model.trim() !== '' &&
      this.verificationCompleted &&
      this.verificationReady
    );
  }

  private initPools(): void {
    const poolSet = new Set<string>();
    if (this.hostnamePrefix) {
      const defaultPool = this.hostnamePrefix.replace(/-$/, '');
      if (defaultPool) {
        poolSet.add(defaultPool);
      }
    }
    for (const dut of this.existingDuts) {
      for (const p of dut.pools || []) {
        if (p && p !== 'DUT_POOL_QUOTA') {
          poolSet.add(p);
        }
      }
    }
    this.availablePools = Array.from(poolSet);
    if (this.availablePools.length > 0) {
      this.selectedPools = [this.availablePools[0]];
    }
  }

  protected get newPoolError(): string {
    const p = this.newPoolInput.trim();
    if (!p) {
      return '';
    }
    if (p.length >= 20 || !/^[a-zA-Z0-9-]+$/.test(p)) {
      return "Must be less than 20 characters and contain only letters, digits, or '-'";
    }
    return '';
  }

  protected onAddNewPool(): void {
    const p = this.newPoolInput.trim();
    if (!p || this.newPoolError) {
      return;
    }
    if (!this.availablePools.includes(p)) {
      this.availablePools = [...this.availablePools, p];
    }
    if (!this.selectedPools.includes(p)) {
      this.selectedPools = [...this.selectedPools, p];
    }
    this.newPoolInput = '';
  }

  protected async scanServos(): Promise<void> {
    this.isScanningServos = true;
    this.cdr.markForCheck();
    try {
      const list = await this.service.getUnassignedServos();
      this.servos = list || [];
      if (
        this.servos.length > 0 &&
        !this.servos.some(s => s.serial === this.selectedServoSerial)
      ) {
        this.selectedServoSerial = this.servos[0].serial;
      }
      this.updateUsbBadgeForDeviceType();
    } catch (e) {
      this.notification.error(`Failed to scan servos: ${this.formatError(e)}`);
    } finally {
      this.isScanningServos = false;
      this.cdr.markForCheck();
    }
  }

  protected onServoChanged(serial: string): void {
    this.selectedServoSerial = serial;
    this.updateUsbBadgeForDeviceType();
  }

  private updateUsbBadgeForDeviceType(): void {
    if (this.selectedDeviceType.toLowerCase() === 'maui') {
      if (this.usbStatus === 'pending') {
        this.usbStatus = 'skipped';
      }
    } else if (this.usbStatus === 'skipped') {
      this.usbStatus = 'pending';
    }
  }

  protected async loadBoards(): Promise<void> {
    this.loadingBoards = true;
    this.cdr.markForCheck();
    try {
      const boards = await this.service.listBoards();
      this.boardOptions = (boards || []).map(b => ({
        text: b,
        value: b,
        label: '',
      }));
    } catch (e) {
      this.notification.error(`Failed to load boards: ${this.formatError(e)}`);
    } finally {
      this.loadingBoards = false;
      this.cdr.markForCheck();
    }
  }

  protected async onBoardChanged(newBoard: string): Promise<void> {
    const trimmed = (newBoard || '').trim();
    if (trimmed === this.board) {
      return;
    }
    this.board = trimmed;
    this.model = '';
    this.modelOptions = [];
    if (!trimmed) {
      return;
    }
    this.loadingModels = true;
    this.cdr.markForCheck();
    try {
      const models = await this.service.listModels(trimmed);
      this.modelOptions = (models || []).map(m => ({
        text: m,
        value: m,
        label: '',
      }));
    } catch (e) {
      this.notification.error(
        `Failed to load models for ${trimmed}: ${this.formatError(e)}`
      );
    } finally {
      this.loadingModels = false;
      this.cdr.markForCheck();
    }
  }

  protected onModelChanged(newModel: string): void {
    const trimmed = (newModel || '').trim();
    if (trimmed === this.model) {
      return;
    }
    this.model = trimmed;
    this.cdr.markForCheck();
  }

  protected onOSChanged(newOS: OS): void {
    if (this.os === newOS) {
      return;
    }
    this.os = newOS;
    this.cdr.markForCheck();
  }

  protected onVerifyClicked(): void {
    if (!this.canVerify) {
      return;
    }
    this.enrollError = '';
    this.isVerifying = true;
    this.isCcdStreaming = true;
    this.verificationCompleted = false;
    this.verificationReady = false;
    this.checks = [];
    this.ccdStatus = 'running';
    this.gbbStatus = 'pending';
    this.usbStatus =
      this.selectedDeviceType.toLowerCase() === 'maui' ? 'skipped' : 'pending';
    this.consoleLogs = '<p>Starting CCD Open & Write Protection check...</p>';

    const servoObj = this.selectedServo;
    if (servoObj && !servoObj.hasGscSibling) {
      this.consoleLogs +=
        '<p class="ccd-message-warn">Warning: GSC (Cr50/Ti50) was not detected next to this servo on USB hub. If CCD open fails, try flipping the USB-C cable on the DUT and clicking Refresh.</p>';
    }

    let ccdHadError = false;
    this.stream = this.service.openCCD({
      servoSerial: this.selectedServoSerial,
      rmaAuth: this.rmaAuth,
      onData: data => {
        if (data.includes('https://')) {
          this.consoleLogs += `<a href="${data}" target="_blank">${data}</a>`;
        } else {
          this.consoleLogs += `<p>${data}</p>`;
        }
        this.cdr.markForCheck();
      },
      onError: e => {
        ccdHadError = true;
        this.isCcdStreaming = false;
        this.isVerifying = false;
        this.verificationCompleted = true;
        this.verificationReady = false;
        this.ccdStatus = 'fail';
        const errMsg = this.formatError(e);
        this.consoleLogs += `<p class="ccd-message-error">CCD Open Error: ${errMsg}</p>`;
        this.consoleLogs +=
          '<p>Preparation failed. Your inputs have been preserved — fix the issue and click "Retry Preparation".</p>';
        this.checks = [
          {
            name: 'CCD Open & Write Protection Status',
            passed: false,
            details: `CCD open failed: ${errMsg}`,
            hint: 'Please check the USB-C/CCD cable connection to the DUT or replug the servo host cable, then retry.',
          },
        ];
        this.cdr.markForCheck();
      },
      finalize: () => {
        this.isCcdStreaming = false;
        if (!ccdHadError) {
          this.ccdStatus = 'pass';
          this.consoleLogs +=
            '<p>CCD Open complete. Running GBB flags & USB drive readiness checks via servod...</p>';
          this.cdr.markForCheck();
          this.runReadinessChecks();
        }
      },
    });
  }

  protected onSubmitRmaCode(): void {
    const code = this.rmaCode.trim();
    if (!code || !this.selectedServoSerial) {
      return;
    }
    this.service.sendMessageToCCDSession({
      servoSerial: this.selectedServoSerial,
      message: code,
    });
    this.rmaCode = '';
  }

  private async runReadinessChecks(): Promise<void> {
    this.gbbStatus = 'running';
    if (this.selectedDeviceType.toLowerCase() !== 'maui') {
      this.usbStatus = 'running';
    }
    this.cdr.markForCheck();

    try {
      const res = await this.service.checkDutReadiness({
        servoSerial: this.selectedServoSerial,
        board: this.board.trim(),
        model: this.model.trim(),
        deviceType: this.selectedDeviceType,
        targetOs: this.os,
        useRmaAuth: this.rmaAuth,
        skipCcdOpen: true,
      });

      this.checks = res.checks || [];
      this.verificationReady = res.isReady;
      this.verificationCompleted = true;

      const gscCheck = this.checks.find(c =>
        c.name.toLowerCase().includes('gsc')
      );
      const ccdCheck = this.checks.find(c =>
        c.name.toLowerCase().includes('ccd')
      );
      const gbbCheck = this.checks.find(c =>
        c.name.toLowerCase().includes('gbb')
      );
      const usbCheck = this.checks.find(c =>
        c.name.toLowerCase().includes('usb')
      );

      this.ccdStatus =
        (gscCheck ? gscCheck.passed : true) &&
        (ccdCheck ? ccdCheck.passed : true)
          ? 'pass'
          : 'fail';
      this.gbbStatus = gbbCheck ? (gbbCheck.passed ? 'pass' : 'fail') : 'pass';
      if (this.selectedDeviceType.toLowerCase() === 'maui') {
        this.usbStatus = 'skipped';
      } else {
        this.usbStatus = usbCheck
          ? usbCheck.passed
            ? 'pass'
            : 'fail'
          : 'fail';
      }

      for (const chk of this.checks) {
        const badge = chk.passed ? '[PASS]' : '[FAIL]';
        const cls = chk.passed ? 'ccd-message-pass' : 'ccd-message-error';
        this.consoleLogs += `<p class="${cls}">${badge} ${chk.name}: ${chk.details}</p>`;
        if (!chk.passed && chk.hint) {
          this.consoleLogs += `<p class="ccd-message-warn">Hint: ${chk.hint}</p>`;
        }
      }

      if (res.isReady) {
        this.consoleLogs +=
          '<p class="ccd-message-pass">All readiness checks PASSED! Ready to enroll.</p>';
      } else {
        this.consoleLogs +=
          '<p class="ccd-message-error">Some readiness checks failed. All inputs have been kept so you can resolve the issue and retry preparation.</p>';
      }
    } catch (e) {
      this.verificationCompleted = true;
      this.verificationReady = false;
      this.gbbStatus = 'fail';
      if (this.selectedDeviceType.toLowerCase() !== 'maui') {
        this.usbStatus = 'fail';
      }
      const msg = this.formatError(e);
      this.consoleLogs += `<p class="ccd-message-error">Readiness check failed: ${msg}</p>`;
      this.consoleLogs +=
        '<p>Your inputs have been preserved — you can retry preparation without re-entering any information.</p>';
    } finally {
      this.isVerifying = false;
      this.cdr.markForCheck();
    }
  }

  protected async onEnrollClicked(): Promise<void> {
    if (!this.canEnroll) {
      return;
    }
    this.isEnrolling = true;
    this.enrollError = '';
    this.loading.next({
      show: true,
      message: 'Discovering IP and enrolling DUT in UFS...',
    });
    this.cdr.markForCheck();

    try {
      const res = await this.service.enrollDutFromWizard({
        hostname: this.fullHostname,
        board: this.board.trim(),
        model: this.model.trim(),
        servoSerial: this.selectedServoSerial.trim(),
        deviceType: this.selectedDeviceType,
        os: this.os,
        asset: this.assetInput.trim(),
        pools: this.selectedPools,
      });

      if (res.deployTaskUrl) {
        this.notification.info(
          [
            `Enrolled ${res.hostname} (${
              res.ipAddress || 'USB'
            }). Deploy/Repair task: `,
            {
              type: 'url',
              url: res.deployTaskUrl,
            },
          ],
          {dismiss: false}
        );
      } else {
        this.notification.info(
          `Successfully enrolled ${res.hostname} (${res.ipAddress || 'USB'}).`,
          {dismiss: false}
        );
      }
      this.dialogRef.close({enrolled: true, hostname: res.hostname});
    } catch (e) {
      const msg = this.formatError(e);
      this.enrollError = `Enrollment failed: ${msg}`;
      this.notification.error(this.enrollError, {dismiss: false});
    } finally {
      this.isEnrolling = false;
      this.loading.next({show: false, message: ''});
      this.cdr.markForCheck();
    }
  }

  protected onCloseClicked(): void {
    this.stream?.cancel();
    this.dialogRef.close();
  }

  private formatError(e: unknown): string {
    return typeof e === 'object' && e !== null && 'message' in e
      ? String((e as {message: unknown}).message)
      : String(e);
  }
}
