import { toString } from "lodash";
import moment from "moment";

export const momentInstance = moment;

export const isDefine = (value: any) => !!toString(value);
