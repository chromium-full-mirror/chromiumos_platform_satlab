import {SatlabRpcServiceClient} from './SatlabrpcServiceClientPb';
import {
  CancelTestEffortRequest,
  CreateTestEffortRequest,
  Dim,
  GetXtsPinsRequest,
  ListAndroidBranchesRequest,
  ListAndroidBuildsRequest,
  ListAndroidSuitesRequest,
  ListAndroidTargetsRequest,
  ListAndroidTestModulesRequest,
  ListTestEffortsRequest,
  ListDriveRequest,
  ListTestPlansRequest,
  RunAndroidLabqualRequest,
  RunSuiteRequest,
  TestEffort,
  ValidateAndroidBuildRequest,
  XtsAndroidBuildPin as XtsAndroidBuildPinPb,
  XtsMultiArchPin as XtsMultiArchPinPb,
  XtsPinVariant as XtsPinVariantPb,
  XtsZipPin as XtsZipPinPb,
} from './satlabrpc_pb';
import {Injectable} from '@angular/core';
import {PROVISION_JOB_NAME} from 'app/constants';
import {IDims} from 'app/models/run_suite_fields';
import {getRPCHost} from 'app/utils/misc';
import {
  catchError,
  defer,
  from,
  map,
  Observable,
  of,
  shareReplay,
  throwError,
} from 'rxjs';

const METADATA_CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_METADATA_CACHE_ENTRIES = 128;

interface CachedMetadataEntry {
  expiresAt: number;
  observable$: Observable<string[]>;
}

export const XTS_TYPES = ['cts', 'gts', 'sts', 'vts'] as const;

export type XtsType = (typeof XTS_TYPES)[number];

export type FirmwareTargetType = 'ap' | 'ec' | 'gsc' | 'fpmcu';
export type FirmwareReadabilityType = 'ro' | 'rw';

export interface FirmwareConfigParam {
  target: FirmwareTargetType;
  type: FirmwareReadabilityType;
  major: number;
  minor: number;
  patch: number;
}

export interface XtsAndroidBuildPin {
  testBuild: string;
  testBranch: string;
  testTargets: string[];
}

export interface XtsZipPin {
  /** Drive file ID. */
  testBuild: string;
  testBuildName: string;
}

export interface XtsMultiArchPin {
  /** Release file name template with `{arch}` unexpanded. */
  testBuildName: string;
  variants: XtsPinVariant[];
}

export interface XtsPinVariant {
  arch: string;
  /** Drive file ID. */
  testBuild: string;
  testBuildName: string;
}

export interface XtsPins {
  cts?: XtsAndroidBuildPin;
  gts?: XtsZipPin;
  sts?: XtsMultiArchPin;
  vts?: XtsAndroidBuildPin;
}

export interface XtsPinsForDevice {
  /** Derived from the requested build target. */
  device: string;
  pins: XtsPins;
}

export function isDriveType(xtsType: XtsType): boolean {
  return xtsType === 'gts' || xtsType === 'sts';
}

function androidBuildPin(
  msg?: XtsAndroidBuildPinPb
): XtsAndroidBuildPin | undefined {
  return msg
    ? {
        testBuild: msg.getTestBuild(),
        testBranch: msg.getTestBranch(),
        testTargets: msg.getTestTargetsList(),
      }
    : undefined;
}

function zipPin(msg?: XtsZipPinPb): XtsZipPin | undefined {
  return msg
    ? {
        testBuild: msg.getTestBuild(),
        testBuildName: msg.getTestBuildName(),
      }
    : undefined;
}

function multiArchPin(msg?: XtsMultiArchPinPb): XtsMultiArchPin | undefined {
  return msg
    ? {
        testBuildName: msg.getTestBuildName(),
        variants: msg.getVariantsList().map(pinVariant),
      }
    : undefined;
}

function pinVariant(msg: XtsPinVariantPb): XtsPinVariant {
  return {
    arch: msg.getArch(),
    testBuild: msg.getTestBuild(),
    testBuildName: msg.getTestBuildName(),
  };
}

@Injectable({
  providedIn: 'root',
})
export class AndroidService {
  private client: SatlabRpcServiceClient;
  private branchesCache = new Map<string, CachedMetadataEntry>();
  private targetsCache = new Map<string, CachedMetadataEntry>();

  constructor() {
    this.client = new SatlabRpcServiceClient(getRPCHost());
  }

  public clearCache(): void {
    this.branchesCache.clear();
    this.targetsCache.clear();
  }

  public listBranches(targets: string[]) {
    const normalizedTargets = Array.from(
      new Set(targets.map(t => t.trim()).filter(t => t !== ''))
    ).sort();
    if (normalizedTargets.length === 0) {
      return of([]);
    }

    const key = normalizedTargets.join('\0');
    return this.getCachedList(this.branchesCache, key, () => {
      const req = new ListAndroidBranchesRequest().setTargetsList(
        normalizedTargets
      );
      return this.client
        .listAndroidBranches(req, {})
        .then(resp => resp.getBranchesList());
    });
  }

  public listTargets(branch: string) {
    const normalizedBranch = branch.trim();
    if (!normalizedBranch) {
      return of([]);
    }

    return this.getCachedList(this.targetsCache, normalizedBranch, () => {
      const req = new ListAndroidTargetsRequest().setBranch(normalizedBranch);
      return this.client
        .listAndroidTargets(req, {})
        .then(resp => resp.getTargetsList());
    });
  }

  private getCachedList(
    cache: Map<string, CachedMetadataEntry>,
    key: string,
    loader: () => Promise<string[]>
  ): Observable<string[]> {
    const now = Date.now();
    const existing = cache.get(key);
    if (existing && existing.expiresAt > now) {
      return existing.observable$.pipe(map(items => [...items]));
    }
    if (existing) {
      cache.delete(key);
    }

    if (cache.size >= MAX_METADATA_CACHE_ENTRIES) {
      for (const [k, entry] of cache.entries()) {
        if (entry.expiresAt <= now) {
          cache.delete(k);
        }
      }
      if (cache.size >= MAX_METADATA_CACHE_ENTRIES) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey !== undefined) {
          cache.delete(oldestKey);
        }
      }
    }

    const observable$ = defer(() => from(loader())).pipe(
      map(items => Array.from(new Set(items))),
      catchError(err => {
        if (cache.get(key)?.observable$ === observable$) {
          cache.delete(key);
        }
        return throwError(() => err);
      }),
      shareReplay({bufferSize: 1, refCount: false})
    );

    cache.set(key, {
      expiresAt: now + METADATA_CACHE_TTL_MS,
      observable$,
    });
    return observable$.pipe(map(items => [...items]));
  }

  public listBuilds(board: string, branch: string, targets: string[]) {
    const req = new ListAndroidBuildsRequest()
      .setBoard(board)
      .setBranch(branch)
      .setTargetsList(targets);

    return from(
      this.client.listAndroidBuilds(req, {}).then(resp => {
        return resp.getBuildsList();
      })
    );
  }

  public listSuites(build: string, target: string) {
    const req = new ListAndroidSuitesRequest()
      .setBuildId(build)
      .setTarget(target);

    return from(
      this.client.listAndroidSuites(req, {}).then(resp => {
        return resp.getSuitesList();
      })
    );
  }

  public listTests(build: string, target: string, suite: string) {
    const req = new ListAndroidTestModulesRequest()
      .setBuildId(build)
      .setTarget(target)
      .setSuite(suite);

    return from(
      this.client.listAndroidTestModules(req, {}).then(resp => {
        return resp.getModulesList();
      })
    );
  }

  public listTestPlans() {
    const req = new ListTestPlansRequest();
    return from(
      this.client.listTestPlans(req, {}).then(resp => {
        return resp.getNamesList();
      })
    );
  }

  public getXtsPins(osBranch: string, target: string) {
    const req = new GetXtsPinsRequest().setOsBranch(osBranch).setTarget(target);

    return from(
      this.client.getXtsPins(req, {}).then(resp => {
        const pins = resp.getPins();
        return {
          device: resp.getDevice(),
          pins: {
            cts: androidBuildPin(pins?.getCts()),
            gts: zipPin(pins?.getGts()),
            sts: multiArchPin(pins?.getSts()),
            vts: androidBuildPin(pins?.getVts()),
          },
        } as XtsPinsForDevice;
      })
    );
  }

  public listDriveXtsPaths(type: 'gts' | 'sts' = 'sts') {
    const req = new ListDriveRequest().setType(type);
    return from(
      this.client.listDrive(req, {}).then(resp => {
        return resp.getFilesList();
      })
    );
  }

  public runSuite(params: {
    buildTarget: string;
    model: string;
    build: string;
    pool: string;
    suite: string;
    targetType: string;
    testInclude: string[];
    testExclulde: string[];
    maxInShard: number;
    dims?: IDims;
    useSignedImage?: boolean;
    useTestRamdisk?: boolean;
    useSatlabCache?: boolean;
    primaryAbiOnly?: boolean;
  }) {
    const req = new RunSuiteRequest()
      .setAndroidDesktop(true)
      .setBuildTarget(params.buildTarget)
      .setModel(params.model)
      .setBuildVersion(params.build)
      .setCft(true)
      .setPool(params.pool)
      .setTagIncludesList([params.suite].filter(e => e.trim() !== ''))
      .setTestNameIncludesList(params.testInclude)
      .setTestNameExcludesList(params.testExclulde)
      .setTargetType(params.targetType)
      .setMaxShard(params.maxInShard)
      .setDimsList(this.toDims(params.dims))
      .setUseSignedImage(params.useSignedImage ?? false)
      .setUseTestRamdisk(params.useTestRamdisk ?? false)
      .setUseSatlabCache(params.useSatlabCache ?? false)
      .setPrimaryAbiOnly(params.primaryAbiOnly ?? true);

    return from(
      this.client.runSuite(req, {}).then(resp => {
        return resp.getBuildLink();
      })
    );
  }

  public provision(params: {
    buildTarget: string;
    model: string;
    build: string;
    pool: string;
    targetType: string;
    dims: IDims;
  }) {
    return this.runSuite({
      buildTarget: params.buildTarget,
      model: params.model,
      build: params.build,
      pool: params.pool,
      suite: '',
      targetType: params.targetType,
      testInclude: [PROVISION_JOB_NAME],
      testExclulde: [],
      maxInShard: 0,
      dims: params.dims,
    });
  }

  public validateBuild(
    board: string,
    branch: string,
    targets: string[],
    build: string
  ) {
    const req = new ValidateAndroidBuildRequest()
      .setBoard(board)
      .setBranch(branch)
      .setTargetsList(targets)
      .setBuild(build);

    return from(
      this.client.validateAndroidBuild(req, {}).then(resp => {
        return resp.getIsValid();
      })
    );
  }

  private toDims(input?: IDims) {
    if (!input) {
      return [];
    }

    return Object.keys(input).map(k => {
      return new Dim().setKey(k).setValue(input[k]);
    });
  }

  public runLabqual(
    hostname: string,
    board: string,
    model: string,
    build: string,
    firmwarePath: string,
    target: string
  ) {
    const req = new RunAndroidLabqualRequest()
      .setBoard(board)
      .setModel(model)
      .setBuild(build)
      .setHostname(hostname)
      .setTarget(target)
      .setFirmwarePath(firmwarePath);

    return from(
      this.client.runAndroidLabqual(req, {}).then(resp => resp.getLink())
    );
  }

  public listTestEfforts(pageSize: number, pageToken: string) {
    const req = new ListTestEffortsRequest()
      .setPageSize(pageSize)
      .setPageToken(pageToken);
    return from(this.client.listTestEfforts(req, {}));
  }

  public createTestEffort(params: {
    board: string;
    model: string;
    branch: string;
    target: string;
    build: string;
    testplan: string;
    pools: {
      label: string;
      type: number;
    }[];
    satlabID?: string;
    product?: string;
    testBranch?: string;
    testTarget?: string;
    testBuild?: string;
    skipBootPrerequisite?: boolean;
    firmwareConfigs?: FirmwareConfigParam[];
  }) {
    const poolLists = params.pools.map(p => {
      return new TestEffort.Pool().setLabel(p.label).setType(p.type);
    });
    const androidBuildTarget = new TestEffort.AndroidBuildTarget()
      .setBranch(params.branch)
      .setTarget(params.target)
      .setBuildId(params.build)
      .setProduct(params.product || '');

    const testEffort = new TestEffort()
      .setAndroid(androidBuildTarget)
      .setBoard(params.board)
      .setModel(params.model)
      .setSatlabId(params.satlabID || '')
      .setPoolsList(poolLists)
      .setTestplan(params.testplan)
      .setSkipBootPrerequisite(params.skipBootPrerequisite || false);

    if (params.testBranch && params.testTarget && params.testBuild) {
      const androidTestTarget = new TestEffort.AndroidBuildTarget()
        .setBranch(params.testBranch)
        .setTarget(params.testTarget)
        .setBuildId(params.testBuild);

      testEffort.setAndroidTestTarget(androidTestTarget);
    }

    if (params.firmwareConfigs && params.firmwareConfigs.length > 0) {
      const fwConfigs = params.firmwareConfigs.map(cfg => {
        const fwTarget = new TestEffort.FirmwareTarget();
        if (cfg.target === 'gsc') {
          const gscVer = new TestEffort.GscTestEffortVersion()
            .setMajorVersion(cfg.major)
            .setMinorVersion(cfg.minor)
            .setGeneration(cfg.patch);
          fwTarget.setGsc(gscVer);
        } else {
          const stdVer = new TestEffort.FirmwareTestEffortVersion()
            .setMajorVersion(cfg.major)
            .setMinorVersion(cfg.minor)
            .setPatchNumber(cfg.patch);
          switch (cfg.target) {
            case 'ap':
              fwTarget.setAp(stdVer);
              break;
            case 'ec':
              fwTarget.setEc(stdVer);
              break;
            case 'fpmcu':
              fwTarget.setFpmcu(stdVer);
              break;
          }
        }

        const fwType =
          cfg.type === 'ro'
            ? TestEffort.FirmwareType.FIRMWARE_TYPE_READ_ONLY
            : TestEffort.FirmwareType.FIRMWARE_TYPE_READ_WRITE;

        return new TestEffort.FirmwareConfig()
          .setFirmwareTarget(fwTarget)
          .setFirmwareTypesList([fwType]);
      });

      testEffort.setFirmwareConfigsList(fwConfigs);
    }

    const req = new CreateTestEffortRequest().setEffort(testEffort);
    return from(this.client.createTestEffort(req, {}));
  }

  public cancelTestEffort(testEffortID: string) {
    const req = new CancelTestEffortRequest().setId(testEffortID);
    return from(this.client.cancelTestEffort(req, {}));
  }
}
