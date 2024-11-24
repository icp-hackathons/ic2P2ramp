import {
  createActor as createDevActor,
  backend as devBackend,
} from '../declarations/backend';
import {
  createActor as createProdActor,
  backend_prod as prodBackend,
} from '../declarations/backend_prod';
import {
  createActor as createFusionActor,
  backend_fusion as fusionBackend,
} from '../declarations/backend_fusion';

const isProduction = process.env.FRONTEND_EVM_ENV === 'production';

export const backend = isProduction ? prodBackend : fusionBackend;
export const createActor = isProduction ? createProdActor : createFusionActor;
