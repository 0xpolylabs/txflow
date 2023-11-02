import { Observable } from 'rxjs'
import { JsonRpcSigner } from 'ethers'

export interface SignerLoginOpts {
  force?: boolean;
}

export type GetSignerOptions<S> = S extends Subsigner<infer Opts> ? Opts : never;

export interface Subsigner<O extends Record<any, any>> {
  login(opts: SignerLoginOpts | O): Observable<JsonRpcSigner>;

  logout(): Observable<unknown>;
}
