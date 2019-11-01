import { SynthUtils } from '@aws-cdk/assert';
import { Stack, SynthesisOptions } from '@aws-cdk/core';
import { toMatchSnapshot } from 'jest-snapshot';
import * as jsYaml from 'js-yaml';

declare global {
  namespace jest {
    interface Matchers<R, T> {
      toMatchCdkSnapshot(options?: Options): R;
    }
  }
}

type Options = SynthesisOptions & {
  /**
   * Output snapshots in YAML (instead of JSON)
   */
  yaml?: boolean;

  /**
   * Match only resources of given types
   */
  subsetResourceTypes?: string[];

  propertyMatchers?: {[property: string]: any}
};

export const toMatchCdkSnapshot = function(
  this: any,
  received: Stack,
  options: Options = {}
) {
  const matcher = toMatchSnapshot.bind(this);
  const { propertyMatchers, ...convertOptions } = options;
  
  return matcher(convertStack(received, convertOptions), propertyMatchers);
};

const convertStack = (stack: Stack, options: Options = {}) => {
  const { yaml, subsetResourceTypes, ...synthOptions } = options;

  const template = SynthUtils.toCloudFormation(stack, synthOptions);

  if (subsetResourceTypes) {
    if (template.Resources) {
      for (const [key, resource] of Object.entries(template.Resources)) {
        if (!subsetResourceTypes.includes((resource as any).Type)) {
          delete template.Resources[key];
        }
      }
    }
  }

  return yaml ? jsYaml.safeDump(template) : template;
};

if (expect !== undefined) {
  expect.extend({ toMatchCdkSnapshot });
} else {
  /* eslint-disable-next-line no-console */
  console.error(
    "Unable to find Jest's global expect." +
      '\nPlease check you have added jest-cdk-snapshot correctly.' +
      '\nSee https://github.com/hupe1980/jest-cdk-snapshot for help.'
  );
}
