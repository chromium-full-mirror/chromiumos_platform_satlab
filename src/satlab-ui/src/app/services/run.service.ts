import {Injectable} from '@angular/core';
import {SatlabRpcServiceClient} from './SatlabrpcServiceClientPb';
import {getRPCHost} from '../utils/misc';
import {IDims} from '../models/dims';
import {ICustomSettings} from '../models/run_suite_fields';
import {AdvancedSettings, Dim, RunRequest} from './satlabrpc_pb';
import {from} from 'rxjs';

export type Suite = {
  kind: 'suite';
  name: string;
};

export type Test = {
  kind: 'test';
  name: string;
  args?: string;
};

export type Testplan = {
  kind: 'testplan';
  name: string;
};

export type Tags =
  | 'tagsToInclude'
  | 'tagsToExclude'
  | 'testNamesInclude'
  | 'testNamesExclude';
type CommonFields = {
  board: string;
  build: string;
  run: Suite | Test | Testplan;
  pool: string;
  dims?: IDims;
  tags?: Partial<Record<Tags, string[]>>;
  advanceSettings: ICustomSettings;
};

export type RunChromeOSRequest = {
  os: 'chromeos';
  model: string;
  milestone: string;
} & CommonFields;

export type RunAndroidOSRequest = {
  os: 'android';
  model?: string;
  target: string;
} & CommonFields;

@Injectable({
  providedIn: 'root',
})
export class RunService {
  private client: SatlabRpcServiceClient;

  constructor() {
    this.client = new SatlabRpcServiceClient(getRPCHost());
  }

  /**
   * run is a function to trigger a job by given model, board, milestone, build version, pool, suite,
   * and additional tags if needed.
   * @param params an object contains the required information
   */
  public run(params: RunChromeOSRequest | RunAndroidOSRequest) {
    const settings = new AdvancedSettings();
    settings.setCft(params.advanceSettings.cft ?? false);
    settings.setTrv2(params.advanceSettings.trv2 ?? false);
    settings.setUploadToCpcon(params.advanceSettings.uploadToCpcon ?? false);
    settings.setMaxInShard(params.advanceSettings.maxInShard ?? 0);
    const servoRequired =
      (params.advanceSettings?.servoRequired as boolean) ?? false;

    const req = new RunRequest()
      .setOs(params.os)
      .setModel(params.model)
      .setBoard(params.board)
      .setBuild(params.build)
      .setPool(params.pool)
      .setDimsList(toDims(servoRequired, params.dims))
      .setTagIncludesList(params.tags.tagsToInclude)
      .setTagExcludesList(params.tags.tagsToExclude)
      .setTestNameIncludesList(params.tags.testNamesInclude)
      .setTestNameExcludesList(params.tags.testNamesExclude)
      .setSettings(settings);

    if (params.os === 'chromeos') {
      req.setModel(params.model).setMilestone(params.milestone);
    } else {
      req.setModel(params.model ?? '').setTarget(params.target);
    }

    switch (params.run.kind) {
      case 'suite': {
        const suite = new RunRequest.Suite();
        suite.setName(params.run.name);
        req.setSuite(suite);
        break;
      }
      case 'test': {
        const test = new RunRequest.Test();
        test.setName(params.run.name);
        test.setArgs((params.run as Test).args);
        req.setTest(test);
        break;
      }
      case 'testplan': {
        const testplan = new RunRequest.Testplan();
        testplan.setName(params.run.name);
        req.setPlan(testplan);
        break;
      }
    }

    return from(
      this.client.run(req, {}).then(resp => {
        return resp.getLink();
      })
    );
  }
}

function toDims(servoRequired: boolean, input?: IDims) {
  const values = {...input};

  if (servoRequired) {
    values['label-servo_state'] = 'WORKING';
  }

  return Object.entries(values).map(([k, v]) => {
    return new Dim().setKey(k).setValue(v);
  });
}
