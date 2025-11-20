import { PrivKey } from '@noble/curves/utils';
import { WeierstrassPoint } from '@noble/curves/abstract/weierstrass';

/**
 * Amountless option.
 */
export declare type AmountlessOption = {
    amount_msat: number;
};

/**
 * Cashu api error.
 */
export declare type ApiError = {
    /**
     * Error message.
     */
    error?: string;
    /**
     * HTTP error code.
     */
    code?: number;
    /**
     * Detailed error message.
     */
    detail?: string;
};

/**
 * AuthManager.
 *
 * - Owns CAT lifecycle (stores, optional refresh via attached OIDCAuth)
 * - Mints and serves BATs (NUT-22)
 * - Validates DLEQs for BATs per NUT-12.
 * - Supplies serialized BATs for 'Blind-auth' and CAT for 'Clear-auth'
 */
export declare class AuthManager implements AuthProvider {
    private readonly mintUrl;
    private readonly req;
    private readonly logger;
    private info?;
    private lockChain?;
    private inflightRefresh?;
    private static readonly MIN_VALID_SECS;
    private oidc?;
    private tokens;
    private pool;
    private desiredPoolSize;
    private maxPerMint;
    private keychain?;
    constructor(mintUrl: string, opts?: AuthManagerOptions);
    /**
     * Attach an OIDCAuth instance so this manager can refresh CATs. Registers a listener to update
     * internal CAT/refresh state on new tokens.
     */
    attachOIDC(oidc: OIDCAuth): this;
    get poolSize(): number;
    get poolTarget(): number;
    get activeAuthKeysetId(): string | undefined;
    get hasCAT(): boolean;
    getCAT(): string | undefined;
    setCAT(cat: string | undefined): void;
    /**
     * Ensure a valid CAT is available (refresh if expiring soon). Returns a token safe to send right
     * now, or undefined if unobtainable.
     */
    ensureCAT(minValidSecs?: number): Promise<string | undefined>;
    private validForAtLeast;
    private updateFromOIDC;
    /**
     * Ensure there are enough BAT tokens (topping up if needed)
     *
     * @param minTokens Minimum tokens needed.
     */
    ensure(minTokens: number): Promise<void>;
    /**
     * Gets a Blind Authentication Token (BAT)
     *
     * @param {method, path} to Call (not used in our implementation)
         * @returns The serialized BAT ready to insert into request header.
         */
     getBlindAuthToken({ method, path, }: {
         method: 'GET' | 'POST';
         path: string;
     }): Promise<string>;
     /**
      * Replace or merge the current BAT pool with previously persisted BATs.
      */
     importPool(proofs: Proof[], mode?: 'replace' | 'merge'): void;
     /**
      * Return a deep-copied snapshot of the current BAT pool (full Proofs, including dleq).
      */
     exportPool(): Proof[];
     /**
      * Extract exp, seconds since epoch, from a JWT access token.
      */
     private parseJwtExpSec;
     /**
      * Simple mutex lock - chains promises in order.
      */
     private withLock;
     /**
      * Initialise mint info and auth keysets/keys as needed.
      */
     private init;
     /**
      * Gets the BAT minting limit: lower of manager limit and Mint’s NUT-22 limit.
      */
     private getBatMaxMint;
     private getActiveKeys;
     /**
      * Mint a batch of BATs using the current CAT if the endpoint is protected by NUT-21.
      */
     private topUp;
    }

    export declare type AuthManagerOptions = {
        /**
         * Hard limit to target when minting BATs in one request. If omitted, we'll read
         * `nuts['22'].bat_max_mint` from the mint "/v1/info" endpoint.
         */
        maxPerMint?: number;
        /**
         * Desired BAT pool size. We’ll top-up to min(desiredPoolSize, bat_max_mint) on demand.
         */
        desiredPoolSize?: number;
        /**
         * Custom request fn (e.g. for tests or host env).
         */
        request?: RequestFn;
        /**
         * Logger.
         */
        logger?: Logger;
    };

    export declare interface AuthProvider {
        getBlindAuthToken(input: {
            method: 'GET' | 'POST';
            path: string;
        }): Promise<string>;
        ensure?(minTokens: number): Promise<void>;
        getCAT(): string | undefined;
        setCAT(cat: string | undefined): void;
        /**
         * Ensure a valid CAT is available, refreshing if expiring soon. Return a token that is safe to
         * send right now, or undefined if not obtainable.
         */
        ensureCAT?(minValiditySec?: number): Promise<string | undefined>;
    }

    export declare function bigIntStringify<T>(_key: unknown, value: T): string | T;

    /**
     * Payload that needs to be sent to the mint when requesting blind auth tokens.
     */
    export declare type BlindAuthMintPayload = {
        /**
         * Outputs (blinded messages) to be signed by the mint.
         */
        outputs: SerializedBlindedMessage[];
    };

    /**
     * Response from the mint after blind auth minting.
     */
    export declare type BlindAuthMintResponse = {
        signatures: SerializedBlindedSignature[];
    } & ApiError;

    export declare type BlindedMessage = {
        B_: WeierstrassPoint<bigint>;
        r: bigint;
        secret: Uint8Array;
        witness?: P2PKWitness;
    };

    export declare function blindMessage(secret: Uint8Array, r?: bigint, privateKey?: PrivKey): BlindedMessage;

    export declare type BlindSignature = {
        C_: WeierstrassPoint<bigint>;
        amount: number;
        id: string;
    };

    /**
     * Payload for requesting a BOLT12 melt quote. Used to pay Lightning Network offers.
     */
    export declare type Bolt12MeltQuotePayload = MeltQuotePayload;

    /**
     * Response from the mint after requesting a BOLT12 melt quote. Contains payment details and state
     * for paying Lightning Network offers.
     */
    export declare type Bolt12MeltQuoteResponse = MeltQuoteResponse;

    /**
     * Payload for requesting a BOLT12 mint quote.
     */
    export declare type Bolt12MintQuotePayload = Omit<MintQuotePayload, 'amount'> & {
        /**
         * Optional amount for the offer. If not specified, then the offer must have an amount.
         */
        amount?: number;
        /**
         * Public key required to lock the quote.
         */
        pubkey: string;
    };

    /**
     * Response from the mint after requesting a BOLT12 mint quote. Contains a Lightning Network offer
     * and tracks payment/issuance amounts.
     */
    export declare type Bolt12MintQuoteResponse = {
        /**
         * Quote identifier.
         */
        quote: string;
        /**
         * BOLT12 offer that can be paid to mint tokens.
         */
        request: string;
        /**
         * Requested amount. This is null for amount-less offers.
         */
        amount: number | null;
        /**
         * Unit of the amount.
         */
        unit: string;
        /**
         * Unix timestamp when quote expires.
         */
        expiry: number | null;
        /**
         * Public key that locked this quote.
         */
        pubkey: string;
        /**
         * The amount that has been paid to the mint via the bolt12 offer. The difference between this and
         * `amount_issued` can be minted.
         */
        amount_paid: number;
        /**
         * The amount of ecash that has been issued for the given mint quote.
         */
        amount_issued: number;
    };

    /**
     * Converts a bytes array to a number.
     *
     * @param bytes To convert to number.
     * @returns Number.
     */
    export declare function bytesToNumber(bytes: Uint8Array): bigint;

    export declare type CancellerLike = SubscriptionCanceller | Promise<SubscriptionCanceller>;

    export declare function checkResponse(data: {
        error?: string;
        detail?: string;
    }): void;

    /**
     * Enum for the state of a proof.
     */
    export declare const CheckStateEnum: {
        readonly UNSPENT: "UNSPENT";
        readonly PENDING: "PENDING";
        readonly SPENT: "SPENT";
    };

    export declare type CheckStateEnum = (typeof CheckStateEnum)[keyof typeof CheckStateEnum];

    /**
     * Payload that needs to be sent to the mint when checking for spendable proofs.
     */
    export declare type CheckStatePayload = {
        /**
         * The Y = hash_to_curve(secret) of the proofs to be checked.
         */
        Ys: string[];
    };

    /**
     * Response when checking proofs if they are spendable. Should not rely on this for receiving, since
     * it can be easily cheated.
     */
    export declare type CheckStateResponse = {
        states: ProofState[];
    } & ApiError;

    /**
     * Outputs messages to the console based on the specified log level.
     *
     * Supports placeholder substitution in messages (e.g., `{key}`) using values from the optional
     * `context` object. Context keys not used in substitution are appended to the output as additional
     * data. Each log message is prefixed with the log level in square brackets (e.g., `[INFO]`).
     *
     * @example Const logger = new ConsoleLogger(LogLevel.DEBUG); logger.info('User {username} logged
     * in', { username: 'alice', ip: '127.0.0.1' }); // Output: [INFO] User alice logged in { ip:
     * "127.0.0.1" }
     */
    export declare class ConsoleLogger implements Logger {
        private minLevel;
        constructor(minLevel?: LogLevel);
        private should;
        private method;
        private header;
        private flattenContext;
        private emit;
        error(msg: string, ctx?: Record<string, unknown>): void;
        warn(msg: string, ctx?: Record<string, unknown>): void;
        info(msg: string, ctx?: Record<string, unknown>): void;
        debug(msg: string, ctx?: Record<string, unknown>): void;
        trace(msg: string, ctx?: Record<string, unknown>): void;
        log(level: LogLevel, message: string, context?: Record<string, unknown>): void;
    }

    export declare function constructProofFromPromise(promise: BlindSignature, r: bigint, secret: Uint8Array, key: WeierstrassPoint<bigint>): RawProof;

    /**
     * Usable counters in range is [start, start+count-1]
     *
     * @example // Start: 5, count: 3 => 5,6,7.
     */
    export declare interface CounterRange {
        start: number;
        count: number;
    }

    export declare interface CounterSource {
        /**
         * Reserve n counters for a keyset.
         *
         * N may be 0. In that case the call MUST NOT mutate state and MUST return { start: currentNext,
         * count: 0 }, effectively a read only peek of the cursor.
         */
        reserve(keysetId: string, n: number): Promise<CounterRange>;
        /**
         * Monotonic bump, ensure the next counter is at least minNext.
         */
        advanceToAtLeast(keysetId: string, minNext: number): Promise<void>;
        /**
         * Optional introspection.
         */
        snapshot?(): Promise<Record<string, number>>;
        /**
         * Optional hard set, useful for tests or migrations.
         */
        setNext?(keysetId: string, next: number): Promise<void>;
    }

    /**
     * High-level helper to create a fully authenticated wallet session.
     *
     * @remarks
     * Like a dependency injector, it wires AuthManager->Mint->OIDCAuth->Wallet in the correct order.
     * Wallet is returned ready to use.
     * @param mintUrl URL of the mint to connect to.
     * @param options.authPool Optional. Desired BAT pool size (default 10)
     * @param options.oidc Optional. Options for OIDCAuth (scope, clientId, logger, etc.)
     * @returns {mint, auth, oidc, wallet} — hydrated, ready to use.
         * @throws If mint does not require authentication.
         */
     export declare function createAuthWallet(mintUrl: string, options?: {
         authPool?: number;
         oidc?: OIDCAuthOptions;
         logger?: Logger;
     }): Promise<{
         mint: Mint;
         auth: AuthManager;
         oidc: OIDCAuth;
         wallet: Wallet;
     }>;

     export declare function createBlindSignature(B_: WeierstrassPoint<bigint>, privateKey: Uint8Array, amount: number, id: string): BlindSignature;

     /**
      * !!! WARNING !!! Not recommended for production use, due to non-constant time operations See:
      * https://github.com/cashubtc/cashu-crypto-ts/pull/2 for more details See:
      * https://en.wikipedia.org/wiki/Timing_attack for information about timing attacks.
      */
     export declare const createDLEQProof: (B_: WeierstrassPoint<bigint>, a: Uint8Array) => DLEQ;

     export declare function createNewMintKeys(pow2height: IntRange<0, 65>, seed?: Uint8Array): KeysetPair;

     export declare const createP2PKsecret: (pubkey: string) => string;

     export declare function createRandomBlindedMessage(privateKey?: PrivKey): BlindedMessage;

     export declare function createRandomSecretKey(): Uint8Array<ArrayBufferLike>;

     export declare function decodePaymentRequest(paymentRequest: string): PaymentRequest_2;

     /**
      * Utility function for deep equality comparison of objects.
      */
     export declare function deepEqual<T>(a: T, b: T): boolean;

     export declare const deriveBlindingFactor: (seed: Uint8Array, keysetId: string, counter: number) => Uint8Array;

     /**
      * Returns the keyset id of a set of keys.
      *
      * @param keys Keys object to derive keyset id from.
      * @param unit (optional) the unit of the keyset.
      * @param expiry (optional) expiry of the keyset.
      * @param versionByte (optional) version of the keyset ID. Default is 0.
      * @param isDeprecatedBase64 (optional) true if the keyset ID should be derived as a deprecated v0
      *   base64 keyset ID.
      * @returns Keyset id of the keys.
      * @throws If keyset versionByte is not valid.
      */
     export declare function deriveKeysetId(keys: Keys, unit?: string, expiry?: number, versionByte?: number, isDeprecatedBase64?: boolean): string;

     export declare const deriveSecret: (seed: Uint8Array, keysetId: string, counter: number) => Uint8Array;

     export declare function deserializeMintKeys(serializedMintKeys: SerializedMintKeys): RawMintKeys;

     export declare const deserializeProof: (proof: SerializedProof) => RawProof;

     export declare type DeviceStartResponse = {
         device_code: string;
         user_code: string;
         verification_uri: string;
         verification_uri_complete?: string;
         interval?: number;
         expires_in?: number;
     };

     export declare type DLEQ = {
         s: Uint8Array;
         e: Uint8Array;
         r?: bigint;
     };

     export declare type Enumerate<N extends number, Acc extends number[] = []> = Acc['length'] extends N ? Acc[number] : Enumerate<N, [...Acc, Acc['length']]>;

     /**
      * Generic melt quote response. All melt quote responses must contain at least these fields. This
      * type is used as a base for both standard and custom payment methods.
      */
     export declare type GenericMeltQuoteResponse = {
         /**
          * Quote ID.
          */
         quote: string;
         /**
          * Amount to be melted.
          */
         amount: number;
         /**
          * Fee reserve to be added to the amount.
          */
         fee_reserve: number;
         /**
          * State of the melt quote.
          */
         state: MeltQuoteState;
         /**
          * Timestamp of when the quote expires.
          */
         expiry: number;
     } & ApiError;

     /**
      * Generic mint quote response. All mint quote responses must contain at least these fields. This
      * type is used as a base for both standard and custom payment methods.
      */
     export declare type GenericMintQuoteResponse = {
         /**
          * Quote ID.
          */
         quote: string;
         /**
          * Amount to be minted.
          */
         amount: number;
         /**
          * Unit of the quote.
          */
         unit: string;
         /**
          * Timestamp of when the quote expires.
          */
         expiry: number;
     } & ApiError;

     /**
      * Helper function to decode cashu tokens into object.
      *
      * @param token An encoded cashu token (cashuAey...)
      * @returns Cashu token object.
      */
     export declare function getDecodedToken(tokenString: string, keysets?: MintKeyset[] | Keyset[]): Token;

     export declare function getDecodedTokenBinary(bytes: Uint8Array): Token;

     /**
      * Helper function to encode a cashu token (defaults to v4 if keyset id allows it)
      *
      * @param token
      * @param [opts]
      */
     export declare function getEncodedToken(token: Token, opts?: {
         version?: 3 | 4;
         removeDleq?: boolean;
     }): string;

     export declare function getEncodedTokenBinary(token: Token): Uint8Array;

     /**
      * Helper function to encode a v3 cashu token.
      *
      * @param token To encode.
      * @returns Encoded token.
      */
     export declare function getEncodedTokenV3(token: Token, removeDleq?: boolean): string;

     export declare function getEncodedTokenV4(token: Token, removeDleq?: boolean): string;

     /**
      * Response from mint at /info endpoint.
      */
     export declare type GetInfoResponse = {
         name: string;
         pubkey: string;
         version: string;
         description?: string;
         description_long?: string;
         icon_url?: string;
         contact: MintContactInfo[];
         nuts: {
             '4': {
                 methods: SwapMethod[];
                 disabled: boolean;
             };
             '5': {
                 methods: SwapMethod[];
                 disabled: boolean;
             };
             '7'?: {
                 supported: boolean;
             };
             '8'?: {
                 supported: boolean;
             };
             '9'?: {
                 supported: boolean;
             };
             '10'?: {
                 supported: boolean;
             };
             '11'?: {
                 supported: boolean;
             };
             '12'?: {
                 supported: boolean;
             };
             '14'?: {
                 supported: boolean;
             };
             '15'?: {
                 methods: MPPMethod[];
             };
             '17'?: {
                 supported: WebSocketSupport[];
             };
             '20'?: {
                 supported: boolean;
             };
             '21'?: {
                 openid_discovery: string;
                 client_id: string;
                 protected_endpoints?: Array<{
                     method: 'GET' | 'POST';
                     path: string;
                 }>;
             };
             '22'?: {
                 bat_max_mint: number;
                 protected_endpoints: Array<{
                     method: 'GET' | 'POST';
                     path: string;
                 }>;
             };
         };
         motd?: string;
     };

     /**
      * Creates a list of amounts to keep based on the proofs we have and the proofs we want to reach.
      *
      * @param proofsWeHave Complete set of proofs stored (from current mint)
      * @param amountToKeep Amount to keep.
      * @param keys Keys of current keyset.
      * @param targetCount The target number of proofs to reach.
      * @returns An array of amounts to keep.
      */
     export declare function getKeepAmounts(proofsWeHave: Proof[], amountToKeep: number, keys: Keys, targetCount: number): number[];

     /**
      * Returns the amounts in the keyset sorted by the order specified.
      *
      * @param keyset To search in.
      * @param order Order to sort the amounts in.
      * @returns The amounts in the keyset sorted by the order specified.
      */
     export declare function getKeysetAmounts(keyset: Keys, order?: 'asc' | 'desc'): number[];

     export declare const getKeysetIdInt: (keysetId: string) => bigint;

     /**
      * Returns the expected witness public keys from a NUT-11 P2PK secret.
      *
      * @param secretStr - The NUT-11 P2PK secret.
      * @returns {array} With the public keys or empty array.
      */
     export declare function getP2PKExpectedKWitnessPubkeys(secretStr: string | Secret): string[];

     /**
      * Returns the locktime from a NUT-11 P2PK secret or Infinity if no locktime.
      *
      * @param secretStr - The NUT-11 P2PK secret.
      * @returns {number} The locktime unix timestamp or Infinity (permanent lock)
      */
     export declare function getP2PKLocktime(secretStr: string | Secret): number;

     /**
      * Returns the number of signatures required from a NUT-11 P2PK secret.
      *
      * @param secretStr - The NUT-11 P2PK secret.
      * @returns {number} The number of signatories (n_sigs / n_sigs_refund) or 0 if secret is unlocked.
      */
     export declare function getP2PKNSigs(secretStr: string | Secret): number;

     /**
      * Returns the sigflag from a NUT-11 P2PK secret.
      *
      * @param secretStr - The NUT-11 P2PK secret.
      * @returns {string} The sigflag or 'SIG_INPUTS' (default)
      */
     export declare function getP2PKSigFlag(secretStr: string | Secret): string;

     /**
      * Returns ALL locktime witnesses from a NUT-11 P2PK secret NB: Does not specify if they are
      * expected to sign - see: getP2PKExpectedKWitnessPubkeys()
      *
      * @param secretStr - The NUT-11 P2PK secret.
      * @returns {array} With the public key(s or empty array.
      */
     export declare function getP2PKWitnessPubkeys(secretStr: string | Secret): string[];

     /**
      * Returns ALL refund witnesses from a NUT-11 P2PK secret NB: Does not specify if they are expected
      * to sign - see: getP2PKExpectedKWitnessPubkeys()
      *
      * @param secretStr - The NUT-11 P2PK secret.
      * @returns {array} With the public keys or empty array.
      */
     export declare function getP2PKWitnessRefundkeys(secretStr: string | Secret): string[];

     /**
      * Gets witness signatures as an array.
      *
      * @param witness From Proof.
      * @returns Array of witness signatures.
      */
     export declare const getP2PKWitnessSignatures: (witness: string | P2PKWitness | undefined) => string[];

     export declare function getPubKeyFromPrivKey(privKey: Uint8Array): Uint8Array<ArrayBufferLike>;

     export declare const getSignedOutput: (output: BlindedMessage, privateKey: PrivKey) => BlindedMessage;

     export declare const getSignedOutputs: (outputs: BlindedMessage[], privateKey: string) => BlindedMessage[];

     /**
      * Helper function to decode different versions of cashu tokens into an object.
      *
      * @param token An encoded cashu token (cashuAey...)
      * @returns Cashu Token object.
      */
     export declare function handleTokens(token: string): Token;

     /**
      * Checks if the provided amount is in the keyset.
      *
      * @param amount Amount to check.
      * @param keyset To search in.
      * @returns True if the amount is in the keyset, false otherwise.
      */
     export declare function hasCorrespondingKey(amount: number, keyset: Keys): boolean;

     export declare function hash_e(pubkeys: Array<WeierstrassPoint<bigint>>): Uint8Array;

     export declare function hashToCurve(secret: Uint8Array): WeierstrassPoint<bigint>;

     /**
      * Checks wether a proof or a list of proofs contains a non-hex id.
      *
      * @param p Proof or list of proofs.
      * @returns Boolean.
      */
     export declare function hasNonHexId(p: Proof | Proof[]): boolean;

     /**
      * Verifies a pubkey has signed a P2PK Proof.
      *
      * @param pubkey - The Cashu P2PK public key (hex-encoded, X-only or with 02/03 prefix).
      * @param proof - A Cashu proof.
      * @returns {boolean} True if one of the signatures is theirs, false otherwise.
      */
     export declare const hasP2PKSignedProof: (pubkey: string, proof: Proof) => boolean;

     /**
      * Checks that the proof has a valid DLEQ proof according to keyset `keys`
      *
      * @param proof The proof subject to verification.
      * @param keyset The Mint's keyset to be used for verification.
      * @returns True if verification succeeded, false otherwise.
      * @throws Error if @param proof does not match any key in @param keyset.
      */
     export declare function hasValidDleq(proof: Proof, keyset: MintKeys | Keyset): boolean;

     /**
      * Converts a hex string to a number.
      *
      * @param hex To convert to number.
      * @returns Number.
      */
     export declare function hexToNumber(hex: string): bigint;

     /**
      * HTLC witness.
      */
     export declare type HTLCWitness = {
         /**
          * Preimage.
          */
         preimage: string;
         /**
          * An array of signatures in hex format.
          */
         signatures?: string[];
     };

     /**
      * This error is thrown when a HTTP response is not 2XX nor a protocol error.
      */
     export declare class HttpResponseError extends Error {
         status: number;
         constructor(message: string, status: number);
     }

     export declare function injectWebSocketImpl(ws: typeof WebSocket): void;

     export declare type IntRange<F extends number, T extends number> = Exclude<Enumerate<T>, Enumerate<F>>;

     export declare function isObj(v: unknown): v is object;

     export declare function isValidHex(str: string): boolean;

     export declare function joinUrls(...parts: string[]): string;

     export declare type JsonRpcReqParams = {
         kind: RpcSubKinds;
         filters: string[];
         subId: string;
     };

     /**
      * Manages the unit-specific keysets for a Mint.
      *
      * @remarks
      * Will ONLY load keysets in the Keychain unit.
      */
     export declare class KeyChain {
         private mint;
         private unit;
         private keysets;
         constructor(mint: string | Mint, unit: string, cachedKeysets?: MintKeyset[], cachedKeys?: MintKeys[] | MintKeys);
         /**
          * Single entry point to load or refresh keysets and keys for the unit.
          *
          * @remarks
          * Fetches in parallel, filters by unit, assigns keys.
          * @param forceRefresh If true, refetch even if loaded.
          */
         init(forceRefresh?: boolean): Promise<void>;
         /**
          * Builds keychain from Mint Keyset and Keys data.
          *
          * @param allKeysets Keyset data from mint.getKeySets() API.
          * @param allKeys Keys data from mint.getKeys() API.
          */
         private buildKeychain;
         /**
          * Get a keyset by ID or the cheapest keyset if no ID is provided.
          *
          * @param id Optional keyset ID.
          * @returns Keyset with keys.
          * @throws If keyset not found or uninitialized.
          */
         getKeyset(id?: string): Keyset;
         /**
          * Get the cheapest active keyset.
          *
          * @remarks
          * Selects active keyset with lowest fee and hex ID.
          * @returns Active Keyset.
          * @throws If none found or uninitialized.
          */
         getCheapestKeyset(): Keyset;
         /**
          * Get list of all keysets for the unit.
          *
          * @returns Array of Keysets.
          * @throws If uninitialized.
          */
         getKeysets(): Keyset[];
         /**
          * Extract the Mint API data from the keychain.
          *
          * @remarks
          * Useful for instantiating new wallets / keychains without repeatedly calling the mint API.
          */
         getCache(): {
             keysets: MintKeyset[];
             keys: MintKeys[];
             unit: string;
             mintUrl: string;
         };
     }

     /**
      * Public keys are a dictionary of number and string. The number represents the amount that the key
      * signs for.
      */
     export declare type Keys = {
         [amount: number]: string;
     };

     export declare class Keyset {
         private _id;
         private _unit;
         private _active;
         private _keys;
         private _input_fee_ppk?;
         private _final_expiry?;
         constructor(id: string, unit: string, active: boolean, input_fee_ppk?: number, final_expiry?: number);
         get id(): string;
         get unit(): string;
         get isActive(): boolean;
         get fee(): number;
         get expiry(): number | undefined;
         get hasKeys(): boolean;
         get hasHexId(): boolean;
         get keys(): Record<number, string>;
         set keys(keys: Record<number, string>);
         /**
          * For compat with v2 MintKeyset type.
          */
         get active(): boolean;
         /**
          * For compat with v2 MintKeyset type.
          */
         get input_fee_ppk(): number;
         /**
          * For compat with v2 MintKeyset type.
          */
         get final_expiry(): number | undefined;
         /**
          * To Mint API MintKeyset format.
          *
          * @returns MintKeyset object.
          */
         toMintKeyset(): MintKeyset;
         /**
          * To Mint API MintKeys format.
          *
          * @returns MintKeys object.
          */
         toMintKeys(): MintKeys | null;
         /**
          * Verifies that the keyset's ID matches the derived ID from its keys, unit, and expiry.
          *
          * @returns True if verification succeeds, false otherwise (e.g., no keys or mismatch).
          */
         verify(): boolean;
     }

     export declare type KeysetPair = {
         keysetId: string;
         pubKeys: RawMintKeys;
         privKeys: RawMintKeys;
     };

     export declare type LockedMintQuoteResponse = MintQuoteResponse & {
         pubkey: string;
     };

     export declare interface Logger {
         error(message: string, context?: Record<string, unknown>): void;
         warn(message: string, context?: Record<string, unknown>): void;
         info(message: string, context?: Record<string, unknown>): void;
         debug(message: string, context?: Record<string, unknown>): void;
         trace(message: string, context?: Record<string, unknown>): void;
         log(level: LogLevel, message: string, context?: Record<string, unknown>): void;
     }

     /**
      * Defines the available log levels for the logger. Log levels are ordered from most severe (FATAL)
      * to least severe (TRACE).
      */
     export declare type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

     /**
      * Blanks for completing a melt operation asynchronously.
      */
     export declare interface MeltBlanks<T extends MeltQuoteResponse = MeltQuoteResponse> {
         method: 'bolt11' | 'bolt12';
         payload: MeltPayload;
         outputData: OutputDataLike[];
         keyset: Keyset;
         quote: T;
     }

     /**
      * Builder for melting proofs to pay a Lightning invoice or BOLT12 offer.
      *
      * @remarks
      * Supports both BOLT11 and BOLT12. You can optionally receive a callback when NUT-08 blanks are
      * created for async melts.
      * @example
      *
      * ```typescript
      * // Basic BOLT11 melt
      * await wallet.ops.meltBolt11(quote, proofs).run();
      *
      * // BOLT12 melt with deterministic change and NUT-08 blanks callback
      * await wallet.ops
      * 	.meltBolt12(quote12, proofs)
      * 	.asDeterministic() // counter 0 auto reserves
      * 	.onChangeOutputsCreated((blanks) => {
      * 		// Persist blanks and retry later with wallet.completeMelt(blanks)
      * 	})
      * 	.onCountersReserved((info) => console.log('Reserved', info))
      * 	.run();
      * ```
      */
     export declare class MeltBuilder {
         private wallet;
         private method;
         private quote;
         private proofs;
         private outputType?;
         private config;
         constructor(wallet: Wallet, method: 'bolt11' | 'bolt12', quote: MeltQuoteResponse, proofs: Proof[]);
         /**
          * Use random blinding for change outputs.
          *
          * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
          */
         asRandom(denoms?: number[]): this;
         /**
          * Use deterministic outputs for change.
          *
          * @param counter Starting counter. Zero means auto reserve using the wallet’s CounterSource.
          * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
          */
         asDeterministic(counter?: number, denoms?: number[]): this;
         /**
          * Use P2PK-locked change (NUT-11).
          *
          * @param options NUT-11 locking options (e.g., pubkey, locktime).
          * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
          */
         asP2PK(options: P2PKOptions, denoms?: number[]): this;
         /**
          * Use a factory to generate OutputData for change.
          *
          * @param factory Factory used to produce blinded messages.
          * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
          */
         asFactory(factory: OutputDataFactory, denoms?: number[]): this;
         /**
          * Provide pre-created OutputData for change.
          *
          * @param data Fully formed OutputData for the change amount.
          */
         asCustom(data: OutputData[]): this;
         /**
          * Use a specific keyset for the melt operation.
          *
          * @param id Keyset id to use for mint keys and fee lookup.
          */
         keyset(id: string): this;
         /**
          * Receive a callback once counters are atomically reserved for deterministic outputs.
          *
          * @param cb Called with OperationCounters when counters are reserved.
          */
         onCountersReserved(cb: OnCountersReserved): this;
         /**
          * Receive a callback when NUT-08 blanks (0-sat change outputs) are created for async melts.
          *
          * @remarks
          * You can persist these blanks and later call `wallet.completeMelt(blanks)` to finalize and
          * recover change once the invoice/offer is paid.
          * @param cb Callback invoked with the created blanks payload.
          */
         onChangeOutputsCreated(cb: NonNullable<MeltProofsConfig['onChangeOutputsCreated']>): this;
         /**
          * Execute the melt against the quote.
          *
          * @returns The melt result: `{ quote, change }`.
          */
         run(): Promise<MeltProofsResponse>;
     }

     /**
      * Builder for melting proofs to pay any custom payment method.
      *
      * @remarks
      * Supports any custom payment method through the generic method parameter.
      * @example
      *
      * ```typescript
      * const result = await wallet.ops
      * 	.meltGeneric('custom-payment', quote, proofs)
      * 	.asDeterministic()
      * 	.run();
      * ```
      */
     declare class MeltBuilderGeneric {
         private wallet;
         private method;
         private quote;
         private amount;
         private proofs;
         private payloadFactory;
         private outputType?;
         private config;
         constructor(wallet: Wallet, method: string, quote: Record<string, unknown> & {
             quote: string;
             amount: number;
             fee_reserve: number;
         }, amount: number, proofs: Proof[], payloadFactory: (proofs: Proof[], outputs: SerializedBlindedMessage[]) => Record<string, unknown>);
         /**
          * Use random blinding for change outputs.
          *
          * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
          */
         asRandom(denoms?: number[]): this;
         /**
          * Use deterministic outputs for change.
          *
          * @param counter Starting counter. Zero means auto reserve using the wallet's CounterSource.
          * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
          */
         asDeterministic(counter?: number, denoms?: number[]): this;
         /**
          * Use P2PK-locked change (NUT-11).
          *
          * @param options NUT-11 locking options (e.g., pubkey, locktime).
          * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
          */
         asP2PK(options: P2PKOptions, denoms?: number[]): this;
         /**
          * Use a factory to generate OutputData for change.
          *
          * @param factory Factory used to produce blinded messages.
          * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
          */
         asFactory(factory: OutputDataFactory, denoms?: number[]): this;
         /**
          * Provide pre-created OutputData for change.
          *
          * @param data Fully formed OutputData for the change amount.
          */
         asCustom(data: OutputData[]): this;
         /**
          * Use a specific keyset for the melt operation.
          *
          * @param id Keyset id to use for mint keys and fee lookup.
          */
         keyset(id: string): this;
         /**
          * Receive a callback once counters are atomically reserved for deterministic outputs.
          *
          * @param cb Called with OperationCounters when counters are reserved.
          */
         onCountersReserved(cb: OnCountersReserved): this;
         /**
          * Receive a callback when NUT-08 blanks (0-sat change outputs) are created for async melts.
          *
          * @remarks
          * You can persist these blanks and later call `wallet.completeMelt(blanks)` to finalize and
          * recover change once the invoice/offer is paid.
          * @param cb Callback invoked with the created blanks payload.
          */
         onChangeOutputsCreated(cb: NonNullable<MeltProofsConfig['onChangeOutputsCreated']>): this;
         /**
          * Execute the melt against the quote using any payment method.
          *
          * @returns The melt result: `{ quote, change }`.
          */
         run(): Promise<MeltProofsResponse>;
     }

     /**
      * Payload that needs to be sent to the mint when melting. Includes Return for overpaid fees.
      */
     export declare type MeltPayload = {
         /**
          * ID of the melt quote.
          */
         quote: string;
         /**
          * Inputs (Proofs) to be melted.
          */
         inputs: Proof[];
         /**
          * Blank outputs (blinded messages) that can be filled by the mint to return overpaid fees.
          */
         outputs: SerializedBlindedMessage[];
     };

     /**
      * Configuration for melting operations.
      */
     export declare type MeltProofsConfig = {
         keysetId?: string;
         onChangeOutputsCreated?: (blanks: MeltBlanks) => void;
         onCountersReserved?: OnCountersReserved;
     };

     /**
      * Response after paying a Lightning invoice.
      */
     export declare type MeltProofsResponse = {
         /**
          * If false, the proofs have not been invalidated and the payment can be tried later again with
          * the same proofs.
          */
         quote: MeltQuoteResponse;
         /**
          * Return/Change from overpaid fees. This happens due to Lighting fee estimation being inaccurate.
          */
         change: Proof[];
     };

     /**
      * Melt quote specific options.
      */
     export declare type MeltQuoteOptions = {
         mpp?: MPPOption;
         amountless?: AmountlessOption;
     };

     /**
      * Payload that needs to be send to the mint to request a melt quote.
      */
     export declare type MeltQuotePayload = {
         /**
          * Unit to be melted.
          */
         unit: string;
         /**
          * Request to be melted to.
          */
         request: string;
         /**
          * Melt Quote options (e.g. multi-path payments NUT-15)
          */
         options?: MeltQuoteOptions;
     };

     export declare type MeltQuoteResponse = PartialMeltQuoteResponse & {
         request: string;
         unit: string;
     };

     export declare const MeltQuoteState: {
         readonly UNPAID: "UNPAID";
         readonly PENDING: "PENDING";
         readonly PAID: "PAID";
     };

     export declare type MeltQuoteState = (typeof MeltQuoteState)[keyof typeof MeltQuoteState];

     export declare function mergeUInt8Arrays(a1: Uint8Array, a2: Uint8Array): Uint8Array;

     export declare class MessageNode {
         private _value;
         private _next;
         get value(): string;
         set value(message: string);
         get next(): MessageNode | null;
         set next(node: MessageNode | null);
         constructor(message: string);
     }

     export declare class MessageQueue {
         private _first;
         private _last;
         get first(): MessageNode | null;
         set first(messageNode: MessageNode | null);
         get last(): MessageNode | null;
         set last(messageNode: MessageNode | null);
         private _size;
         get size(): number;
         set size(v: number);
         constructor();
         enqueue(message: string): boolean;
         dequeue(): string | null;
     }

     /**
      * Class represents Cashu Mint API.
      *
      * @remarks
      * This class contains lower-level functions that are implemented by Wallet.
      */
     export declare class Mint {
         private ws?;
         private _mintUrl;
         private _request;
         private _logger;
         private _mintInfo?;
         private _authProvider?;
         /**
          * @param mintUrl Requires mint URL to create this object.
          * @param customRequest Optional, for custom network communication with the mint.
          * @param authTokenGetter Optional. Function to obtain a NUT-22 BlindedAuthToken (e.g. from a
          *   database or localstorage)
          */
         constructor(mintUrl: string, options?: {
             customRequest?: RequestFn;
             authProvider?: AuthProvider;
             logger?: Logger;
         });
         get mintUrl(): string;
         /**
          * Create an OIDC client using this mint’s NUT-21 metadata.
          *
          * @example
          *
          * ```ts
          * const oidc = await mint.oidcAuth({ onTokens: (t) => authMgr.setCAT(t.access_token!) });
          * const start = await oidc.deviceStart();
          * // show start.user_code / start.verification_uri to the user
          * const token = await oidc.devicePoll(start.device_code, start.interval ?? 5);
          * // token.access_token is your CAT
          * ```
          */
         oidcAuth(opts?: OIDCAuthOptions): Promise<OIDCAuth>;
         /**
          * Fetches mint's info at the /info endpoint.
          *
          * @param customRequest Optional override for the request function.
          * @returns The mint's information response.
          */
         getInfo(customRequest?: RequestFn): Promise<GetInfoResponse>;
         /**
          * Lazily fetches and caches the mint's info if not already loaded.
          *
          * @returns The parsed MintInfo object.
          */
         getLazyMintInfo(): Promise<MintInfo>;
         /**
          * Performs a swap operation with ecash inputs and outputs.
          *
          * @param swapPayload Payload containing inputs and outputs.
          * @param customRequest Optional override for the request function.
          * @returns Signed outputs.
          */
         swap(swapPayload: SwapPayload, customRequest?: RequestFn): Promise<SwapResponse>;
         /**
          * Requests a new mint quote from the mint.
          *
          * @param mintQuotePayload Payload for creating a new mint quote.
          * @param customRequest Optional override for the request function.
          * @returns A new mint quote containing a payment request for the specified amount and unit.
          */
         createMintQuoteBolt11(mintQuotePayload: MintQuotePayload, customRequest?: RequestFn): Promise<PartialMintQuoteResponse>;
         /**
          * Requests a new BOLT12 mint quote from the mint using Lightning Network offers.
          *
          * @param mintQuotePayload Payload containing amount, unit, optional description, and required
          *   pubkey.
          * @param customRequest Optional override for the request function.
          * @returns A mint quote containing a BOLT12 offer.
          */
         createMintQuoteBolt12(mintQuotePayload: Bolt12MintQuotePayload, customRequest?: RequestFn): Promise<Bolt12MintQuoteResponse>;
         /**
          * Gets an existing mint quote from the mint.
          *
          * @param quote Quote ID.
          * @param customRequest Optional override for the request function.
          * @returns The status of the mint quote, including payment details and state.
          */
         checkMintQuoteBolt11(quote: string, customRequest?: RequestFn): Promise<PartialMintQuoteResponse>;
         /**
          * Gets an existing BOLT12 mint quote from the mint.
          *
          * @param quote Quote ID to check.
          * @param customRequest Optional override for the request function.
          * @returns Updated quote with current payment and issuance amounts.
          */
         checkMintQuoteBolt12(quote: string, customRequest?: RequestFn): Promise<Bolt12MintQuoteResponse>;
         /**
          * Mints new tokens by requesting blind signatures on the provided outputs.
          *
          * @param mintPayload Payload containing the outputs to get blind signatures on.
          * @param customRequest Optional override for the request function.
          * @returns Serialized blinded signatures.
          */
         mintBolt11(mintPayload: MintPayload, customRequest?: RequestFn): Promise<MintResponse>;
         /**
          * Mints new tokens using a BOLT12 quote by requesting blind signatures on the provided outputs.
          *
          * @param mintPayload Payload containing the quote ID and outputs to get blind signatures on.
          * @param customRequest Optional override for the request function.
          * @returns Serialized blinded signatures for the requested outputs.
          */
         mintBolt12(mintPayload: MintPayload, customRequest?: RequestFn): Promise<MintResponse>;
         /**
          * Generic method to create a mint quote for any payment method.
          *
          * @remarks
          * This method enables support for custom payment methods without modifying the Mint class. It
          * constructs the endpoint as `/v1/mint/quote/{method}` and POSTs the payload.
          * @example
          *
          * ```ts
          * const response = await mint.createMintQuote('bolt11', { unit: 'sat', amount: 100 });
          * const response = await mint.createMintQuote('custom-payment', {
          * 	unit: 'sat',
          * 	amount: 100,
          * });
          * ```
          *
          * @param method The payment method (e.g., 'bolt11', 'bolt12', or custom method name).
          * @param mintQuotePayload Payload for creating a mint quote.
          * @param customRequest Optional override for the request function.
          * @returns The mint quote response (must contain quote, amount, unit, expiry).
          */
         createMintQuote<T extends Record<string, unknown>>(method: string, mintQuotePayload: Record<string, unknown>, customRequest?: RequestFn): Promise<T & {
             quote: string;
             amount: number;
             unit: string;
             expiry: number;
         }>;
         /**
          * Generic method to check the status of a mint quote for any payment method.
          *
          * @remarks
          * This method enables support for custom payment methods without modifying the Mint class. It
          * constructs the endpoint as `/v1/mint/quote/{method}/{quote}` and performs a GET request.
          * @param method The payment method (e.g., 'bolt11', 'bolt12', or custom method name).
          * @param quote The quote ID to check.
          * @param customRequest Optional override for the request function.
          * @returns The mint quote status (must contain quote, amount, unit, expiry).
          */
         checkMintQuote<T extends Record<string, unknown>>(method: string, quote: string, customRequest?: RequestFn): Promise<T & {
             quote: string;
             amount: number;
             unit: string;
             expiry: number;
         }>;
         /**
          * Generic method to create a melt quote for any payment method.
          *
          * @remarks
          * This method enables support for custom payment methods without modifying the Mint class. It
          * constructs the endpoint as `/v1/melt/quote/{method}` and POSTs the payload.
          * @param method The payment method (e.g., 'bolt11', 'bolt12', or custom method name).
          * @param meltQuotePayload Payload for creating a melt quote.
          * @param customRequest Optional override for the request function.
          * @returns The melt quote response (must contain quote, amount, fee_reserve, state, expiry).
          */
         createMeltQuote<T extends Record<string, unknown>>(method: string, meltQuotePayload: Record<string, unknown>, customRequest?: RequestFn): Promise<T & {
             quote: string;
             amount: number;
             fee_reserve: number;
             state: string;
             expiry: number;
         }>;
         /**
          * Generic method to check the status of a melt quote for any payment method.
          *
          * @remarks
          * This method enables support for custom payment methods without modifying the Mint class. It
          * constructs the endpoint as `/v1/melt/quote/{method}/{quote}` and performs a GET request.
          * @param method The payment method (e.g., 'bolt11', 'bolt12', or custom method name).
          * @param quote The quote ID to check.
          * @param customRequest Optional override for the request function.
          * @returns The melt quote status (must contain quote, amount, fee_reserve, state, expiry).
          */
         checkMeltQuote<T extends Record<string, unknown>>(method: string, quote: string, customRequest?: RequestFn): Promise<T & {
             quote: string;
             amount: number;
             fee_reserve: number;
             state: string;
             expiry: number;
         }>;
         /**
          * Requests a new melt quote from the mint.
          *
          * @param meltQuotePayload Payload for creating a new melt quote.
          * @param customRequest Optional override for the request function.
          * @returns The melt quote response.
          */
         createMeltQuoteBolt11(meltQuotePayload: MeltQuotePayload, customRequest?: RequestFn): Promise<PartialMeltQuoteResponse>;
         /**
          * Requests a new BOLT12 melt quote from the mint for paying a Lightning Network offer. For
          * amount-less offers, specify the amount in options.amountless.amount_msat.
          *
          * @param meltQuotePayload Payload containing the BOLT12 offer to pay and unit.
          * @param customRequest Optional override for the request function.
          * @returns Melt quote with amount, fee reserve, and payment state.
          */
         createMeltQuoteBolt12(meltQuotePayload: MeltQuotePayload, customRequest?: RequestFn): Promise<Bolt12MeltQuoteResponse>;
         /**
          * Gets an existing melt quote.
          *
          * @param quote Quote ID.
          * @param customRequest Optional override for the request function.
          * @returns The melt quote response.
          */
         checkMeltQuoteBolt11(quote: string, customRequest?: RequestFn): Promise<PartialMeltQuoteResponse>;
         /**
          * Gets an existing BOLT12 melt quote from the mint. Returns current payment state (UNPAID,
          * PENDING, or PAID) and payment preimage if paid.
          *
          * @param quote Quote ID to check.
          * @param customRequest Optional override for the request function.
          * @returns Updated quote with current payment state and preimage if available.
          */
         checkMeltQuoteBolt12(quote: string, customRequest?: RequestFn): Promise<Bolt12MeltQuoteResponse>;
         /**
          * Requests the mint to pay for a Bolt11 payment request by providing ecash as inputs to be spent.
          * The inputs contain the amount and the fee_reserves for a Lightning payment. The payload can
          * also contain blank outputs in order to receive back overpaid Lightning fees.
          *
          * @param meltPayload The melt payload containing inputs and optional outputs.
          * @param options.customRequest Optional override for the request function.
          * @param options.preferAsync Optional override to set 'respond-async' header.
          * @returns The melt response.
          */
         meltBolt11(meltPayload: MeltPayload, options?: {
             customRequest?: RequestFn;
             preferAsync?: boolean;
         }): Promise<PartialMeltQuoteResponse>;
         /**
          * Requests the mint to pay a BOLT12 offer by providing ecash inputs to be spent. The inputs must
          * cover the amount plus fee reserves. Optional outputs can be included to receive change for
          * overpaid Lightning fees.
          *
          * @param meltPayload Payload containing quote ID, inputs, and optional outputs for change.
          * @param options.customRequest Optional override for the request function.
          * @param options.preferAsync Optional override to set 'respond-async' header.
          * @returns Payment result with state and optional change signatures.
          */
         meltBolt12(meltPayload: MeltPayload, options?: {
             customRequest?: RequestFn;
             preferAsync?: boolean;
         }): Promise<Bolt12MeltQuoteResponse>;
         /**
          * Checks if specific proofs have already been redeemed.
          *
          * @param checkPayload The payload containing proofs to check.
          * @param customRequest Optional override for the request function.
          * @returns Redeemed and unredeemed ordered list of booleans.
          */
         check(checkPayload: CheckStatePayload, customRequest?: RequestFn): Promise<CheckStateResponse>;
         /**
          * Get the mint's public keys.
          *
          * @param keysetId Optional param to get the keys for a specific keyset. If not specified, the
          *   keys from all active keysets are fetched.
          * @param mintUrl Optional alternative mint URL to use for this request.
          * @param customRequest Optional override for the request function.
          * @returns The mint's public keys.
          */
         getKeys(keysetId?: string, mintUrl?: string, customRequest?: RequestFn): Promise<MintActiveKeys>;
         /**
          * Get the mint's keysets in no specific order.
          *
          * @param customRequest Optional override for the request function.
          * @returns All the mint's past and current keysets.
          */
         getKeySets(customRequest?: RequestFn): Promise<MintAllKeysets>;
         /**
          * Restores proofs from the provided blinded messages.
          *
          * @param restorePayload The payload containing outputs to restore.
          * @param customRequest Optional override for the request function.
          * @returns The restore response with outputs and signatures.
          */
         restore(restorePayload: PostRestorePayload, customRequest?: RequestFn): Promise<PostRestoreResponse>;
         /**
          * Tries to establish a websocket connection with the websocket mint url according to NUT-17.
          */
         connectWebSocket(): Promise<void>;
         /**
          * Generic method to mint tokens using any payment method endpoint.
          *
          * @remarks
          * This method enables support for custom payment methods without modifying the Mint class. It
          * constructs the endpoint as `/v1/mint/{method}` and POSTs the payload.
          * @example
          *
          * ```ts
          * const response = await mint.mint('bolt11', { quote: 'q1', outputs: [...] });
          * const response = await mint.mint('custom-payment', { quote: 'c1', outputs: [...] });
          * ```
          *
          * @param method The payment method (e.g., 'bolt11', 'bolt12', or custom method name).
          * @param mintPayload Payload containing the quote ID and outputs.
          * @param customRequest Optional override for the request function.
          * @returns Serialized blinded signatures for the requested outputs.
          */
         mint(method: string, mintPayload: MintPayload, customRequest?: RequestFn): Promise<MintResponse>;
         /**
          * Generic method to melt tokens using any payment method endpoint.
          *
          * @remarks
          * This method enables support for custom payment methods without modifying the Mint class. It
          * constructs the endpoint as `/v1/melt/{method}` and POSTs the payload. The response must contain
          * the common fields: quote, amount, fee_reserve, state, expiry.
          * @example
          *
          * ```ts
          * const response = await mint.melt('bolt11', { quote: 'q1', inputs: [...], outputs: [...] });
          * const response = await mint.melt('custom-payment', { quote: 'c1', inputs: [...], outputs: [...] });
          * ```
          *
          * @param method The payment method (e.g., 'bolt11', 'bolt12', or custom method name).
          * @param meltPayload The melt payload containing inputs and optional outputs.
          * @param options.customRequest Optional override for the request function.
          * @param options.preferAsync Optional override to set 'respond-async' header.
          * @returns A response object with at least the required melt quote fields.
          */
         melt<T extends Record<string, unknown>>(method: string, meltPayload: MeltPayload, options?: {
             customRequest?: RequestFn;
             preferAsync?: boolean;
         }): Promise<T & {
             quote: string;
             amount: number;
             fee_reserve: number;
             state: string;
             expiry: number;
         }>;
         /**
          * Closes a websocket connection.
          */
         disconnectWebSocket(): void;
         get webSocketConnection(): WSConnection | undefined;
         /**
          * Returns the Clear Authentication Token (CAT) to use in the 'Clear-auth' header, or undefined if
          * not required for the given path and method.
          *
          * @param method The method to call on the path.
          * @param path The API path to check for blind auth requirement.
          * @returns The blind auth token if required, otherwise undefined.
          */
         private handleClearAuth;
         /**
          * Returns a serialized Blind Authentication Token (BAT) to use in the 'Blind-auth' header, or
          * undefined if not required for the given path and method.
          *
          * @param method The method to call on the path.
          * @param path The API path to check for blind auth requirement.
          * @returns The blind auth token if required, otherwise undefined.
          */
         private handleBlindAuth;
         private requestWithAuth;
     }

     /**
      * An array of mint keysets.
      */
     export declare type MintActiveKeys = {
         /**
          * Keysets.
          */
         keysets: MintKeys[];
     };

     /**
      * An array of mint keyset entries.
      */
     export declare type MintAllKeysets = {
         /**
          * Keysets.
          */
         keysets: MintKeyset[];
     };

     /**
      * Builder for minting proofs from a quote.
      *
      * @remarks
      * Bolt12 requires privkey by default, bolt11 only for locked quotes. The compiler will throw an
      * error if bolt12 and privkey() is omitted: MintBuilder<"bolt12", false>' is not assignable...
      * @example
      *
      *     const proofs = await wallet.ops
      *     	.mint(100, quote)
      *     	.asDeterministic() // counter 0 auto reserves
      *     	.onCountersReserved((info) => console.log(info))
      *     	.privkey('sk')
      *     	.run();
      */
     export declare class MintBuilder<M extends 'bolt11' | 'bolt12', HasPrivKey extends boolean = M extends 'bolt12' ? false : true> {
         private wallet;
         private method;
         private amount;
         private quote;
         private outputType?;
         private config;
         private readonly _hasPrivkey;
         constructor(wallet: Wallet, method: M, amount: number, quote: string | MintQuoteResponse | Bolt12MintQuoteResponse);
         /**
          * Use random blinding for the minted proofs.
          *
          * @remarks
          * If denoms specified, proofsWeHave() will have no effect.
          * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
          */
         asRandom(denoms?: number[]): this;
         /**
          * Use deterministic outputs for the minted proofs.
          *
          * @remarks
          * If denoms specified, proofsWeHave() will have no effect.
          * @param counter Starting counter. Zero means auto reserve using the wallet’s CounterSource.
          * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
          */
         asDeterministic(counter?: number, denoms?: number[]): this;
         /**
          * Use P2PK locked outputs for the minted proofs.
          *
          * @remarks
          * If denoms specified, proofsWeHave() will have no effect.
          * @param options NUT 11 options like pubkey and locktime.
          * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
          */
         asP2PK(options: P2PKOptions, denoms?: number[]): this;
         /**
          * Use a factory to generate OutputData for minted proofs.
          *
          * @remarks
          * If denoms specified, proofsWeHave() will have no effect.
          * @param factory OutputDataFactory used to produce blinded messages.
          * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
          */
         asFactory(factory: OutputDataFactory, denoms?: number[]): this;
         /**
          * Provide pre created OutputData for minted proofs.
          *
          * @param data Fully formed OutputData for the final amount.
          */
         asCustom(data: OutputData[]): this;
         /**
          * Use a specific keyset for the operation.
          *
          * @param id Keyset id to use for mint keys and fee lookup.
          */
         keyset(id: string): this;
         /**
          * Private key to sign locked mint quotes.
          *
          * @param k Private key for locked quotes.
          */
         privkey(k: string): MintBuilder<M, true>;
         /**
          * Provide existing proofs to help optimise denomination selection.
          *
          * @remarks
          * Has no effect if denominations (custom split) was specified.
          * @param p Proofs currently held by the wallet, used to hit denomination targets.
          */
         proofsWeHave(p: Proof[]): this;
         /**
          * Receive a callback once counters are atomically reserved for deterministic outputs.
          *
          * @param cb Called with OperationCounters when counters are reserved.
          */
         onCountersReserved(cb: OnCountersReserved): this;
         /**
          * Execute minting against the quote.
          *
          * @remarks
          * This method can only be called for bolt12 quotes when .privkey() is set.
          * @returns The newly minted proofs.
          */
         run(this: MintBuilder<M, true>): Promise<Proof[]>;
     }

     /**
      * Builder for minting proofs from a quote using any payment method.
      *
      * @remarks
      * Supports any custom payment method through the generic method parameter.
      * @example
      *
      * ```typescript
      * const proofs = await wallet.ops
      * 	.mintGeneric('custom-payment', 100, quote)
      * 	.asDeterministic()
      * 	.run();
      * ```
      */
     declare class MintBuilderGeneric {
         private wallet;
         private method;
         private amount;
         private payloadFactory;
         private outputType?;
         private config;
         constructor(wallet: Wallet, method: string, amount: number, payloadFactory: (blindedMessages: SerializedBlindedMessage[]) => Record<string, unknown>);
         /**
          * Use random blinding for the minted proofs.
          *
          * @remarks
          * If denoms specified, proofsWeHave() will have no effect.
          * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
          */
         asRandom(denoms?: number[]): this;
         /**
          * Use deterministic outputs for the minted proofs.
          *
          * @remarks
          * If denoms specified, proofsWeHave() will have no effect.
          * @param counter Starting counter. Zero means auto reserve using the wallet's CounterSource.
          * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
          */
         asDeterministic(counter?: number, denoms?: number[]): this;
         /**
          * Use P2PK locked outputs for the minted proofs.
          *
          * @remarks
          * If denoms specified, proofsWeHave() will have no effect.
          * @param options NUT 11 options like pubkey and locktime.
          * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
          */
         asP2PK(options: P2PKOptions, denoms?: number[]): this;
         /**
          * Use a factory to generate OutputData for minted proofs.
          *
          * @remarks
          * If denoms specified, proofsWeHave() will have no effect.
          * @param factory OutputDataFactory used to produce blinded messages.
          * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
          */
         asFactory(factory: OutputDataFactory, denoms?: number[]): this;
         /**
          * Provide pre created OutputData for minted proofs.
          *
          * @param data Fully formed OutputData for the final amount.
          */
         asCustom(data: OutputData[]): this;
         /**
          * Use a specific keyset for the operation.
          *
          * @param id Keyset id to use for mint keys and fee lookup.
          */
         keyset(id: string): this;
         /**
          * Provide existing proofs to help optimise denomination selection.
          *
          * @remarks
          * Has no effect if denominations (custom split) was specified.
          * @param p Proofs currently held by the wallet, used to hit denomination targets.
          */
         proofsWeHave(p: Proof[]): this;
         /**
          * Receive a callback once counters are atomically reserved for deterministic outputs.
          *
          * @param cb Called with OperationCounters when counters are reserved.
          */
         onCountersReserved(cb: OnCountersReserved): this;
         /**
          * Execute minting against the quote using any payment method.
          *
          * @returns The newly minted proofs.
          */
         run(): Promise<Proof[]>;
     }

     export declare type MintContactInfo = {
         method: string;
         info: string;
     };

     export declare class MintInfo {
         private readonly _mintInfo;
         private readonly _protected22?;
         private readonly _protected21?;
         private readonly REGEX_METACHAR;
         constructor(info: GetInfoResponse);
         isSupported(num: 4 | 5): {
             disabled: boolean;
             params: SwapMethod[];
         };
         isSupported(num: 7 | 8 | 9 | 10 | 11 | 12 | 14 | 20): {
             supported: boolean;
         };
         isSupported(num: 17): {
             supported: boolean;
             params?: WebSocketSupport[];
         };
         isSupported(num: 15): {
             supported: boolean;
             params?: MPPMethod[];
         };
         requiresBlindAuthToken(method: 'GET' | 'POST', path: string): boolean;
         requiresClearAuthToken(method: 'GET' | 'POST', path: string): boolean;
         private matchesProtected;
         private checkGenericNut;
         private checkMintMelt;
         private checkNut17;
         private checkNut15;
         private toEndpoints;
         private buildIndex;
         get contact(): MintContactInfo[];
         get description(): string | undefined;
         get description_long(): string | undefined;
         get name(): string;
         get pubkey(): string;
         get nuts(): {
             '4': {
                 methods: SwapMethod[];
                 disabled: boolean;
             };
             '5': {
                 methods: SwapMethod[];
                 disabled: boolean;
             };
             '7'?: {
                 supported: boolean;
             };
             '8'?: {
                 supported: boolean;
             };
             '9'?: {
                 supported: boolean;
             };
             '10'?: {
                 supported: boolean;
             };
             '11'?: {
                 supported: boolean;
             };
             '12'?: {
                 supported: boolean;
             };
             '14'?: {
                 supported: boolean;
             };
             '15'?: {
                 methods: MPPMethod[];
             };
             '17'?: {
                 supported: WebSocketSupport[];
             };
             '20'?: {
                 supported: boolean;
             };
             '21'?: {
                 openid_discovery: string;
                 client_id: string;
                 protected_endpoints?: Array<{
                     method: "GET" | "POST";
                     path: string;
                 }>;
             };
             '22'?: {
                 bat_max_mint: number;
                 protected_endpoints: Array<{
                     method: "GET" | "POST";
                     path: string;
                 }>;
             };
         };
         get version(): string;
         get motd(): string | undefined;
         /**
          * Checks if the mint supports creating BOLT12 offers with a description.
          *
          * @returns True if the mint supports offers with a description, false otherwise.
          */
         get supportsBolt12Description(): boolean;
     }

     /**
      * A mint keyset.
      */
     export declare type MintKeys = {
         /**
          * Keyset ID.
          */
         id: string;
         /**
          * Unit of the keyset.
          */
         unit: string;
         /**
          * Expiry of the keyset.
          */
         final_expiry?: number;
         /**
          * Public keys are a dictionary of number and string. The number represents the amount that the
          * key signs for.
          */
         keys: Keys;
     };

     /**
      * A mint keyset entry.
      */
     export declare type MintKeyset = {
         /**
          * Keyset ID.
          */
         id: string;
         /**
          * Unit of the keyset.
          */
         unit: string;
         /**
          * Whether the keyset is active or not.
          */
         active: boolean;
         /**
          * Input fee for keyset (in ppk)
          */
         input_fee_ppk?: number;
         /**
          * Expiry of the keyset.
          */
         final_expiry?: number;
     };

     /**
      * This error is thrown when a [protocol
      * error](https://github.com/cashubtc/nuts/blob/main/00.md#errors) occurs. See error codes
      * [here](https://github.com/cashubtc/nuts/blob/main/error_codes.md).
      */
     export declare class MintOperationError extends HttpResponseError {
         code: number;
         constructor(code: number, detail: string);
     }

     /**
      * Payload that needs to be sent to the mint when requesting a mint.
      */
     export declare type MintPayload = {
         /**
          * Quote ID received from the mint.
          */
         quote: string;
         /**
          * Outputs (blinded messages) to be signed by the mint.
          */
         outputs: SerializedBlindedMessage[];
         /**
          * Public key the quote is locked to.
          */
         signature?: string;
     };

     /**
      * Configuration for minting operations.
      */
     export declare type MintProofsConfig = {
         keysetId?: string;
         privkey?: string;
         proofsWeHave?: Proof[];
         onCountersReserved?: OnCountersReserved;
     };

     /**
      * Payload that needs to be sent to the mint when requesting a mint.
      */
     export declare type MintQuotePayload = {
         /**
          * Unit to be minted.
          */
         unit: string;
         /**
          * Amount to be minted.
          */
         amount: number;
         /**
          * Description for the invoice.
          */
         description?: string;
         /**
          * Public key to lock the quote to.
          */
         pubkey?: string;
     };

     export declare type MintQuoteResponse = PartialMintQuoteResponse & {
         amount: number;
         unit: string;
     };

     export declare const MintQuoteState: {
         readonly UNPAID: "UNPAID";
         readonly PAID: "PAID";
         readonly ISSUED: "ISSUED";
     };

     export declare type MintQuoteState = (typeof MintQuoteState)[keyof typeof MintQuoteState];

     /**
      * Response from the mint after requesting a mint.
      */
     export declare type MintResponse = {
         signatures: SerializedBlindedSignature[];
     } & ApiError;

     /**
      * MPP supported methods.
      */
     export declare type MPPMethod = {
         method: string;
         unit: string;
     };

     /**
      * Multi path payments option.
      */
     export declare type MPPOption = {
         amount: number;
     };

     /**
      * This error is thrown when a network request fails.
      */
     export declare class NetworkError extends Error {
         constructor(message: string);
     }

     /**
      * Converts a number to a hex string of 64 characters.
      *
      * @param number (bigint) to conver to hex.
      * @returns Hex string start-padded to 64 characters.
      */
     export declare function numberToHexPadded64(number: bigint): string;

     /**
      * Used to express a spending condition that proofs should be encumbered with.
      */
     export declare type NUT10Option = {
         /**
          * The kind of spending condition.
          */
         kind: string;
         /**
          * Expresses the spending condition relative to the kind.
          */
         data: string;
         /**
          * Tags associated with the spending condition for additional data.
          */
         tags: string[][];
     };

     export declare class OIDCAuth {
         private readonly discoveryUrl;
         private readonly logger;
         private clientId;
         private scope;
         private config?;
         private onTokens?;
         private tokenListeners;
         static fromMintInfo(info: {
             nuts: GetInfoResponse['nuts'];
         }, opts?: OIDCAuthOptions): OIDCAuth;
         constructor(discoveryUrl: string, opts?: OIDCAuthOptions);
         setClient(id: string): void;
         setScope(scope?: string): void;
         /**
          * Subscribe to token updates. Listeners are called after the primary onTokens callback.
          */
         addTokenListener(fn: (t: TokenResponse) => void | Promise<void>): void;
         loadConfig(): Promise<OIDCConfig>;
         /**
          * Generate a PKCE verifier and S256 challenge.
          *
          * - Verifier: base64url of random bytes, length >= 43, RFC 7636 compliant.
          * - Challenge: base64url(sha256(verifier))
          */
         generatePKCE(): {
             verifier: string;
             challenge: string;
         };
         /**
          * Build an Authorization Code + PKCE URL.
          */
         buildAuthCodeUrl(input: {
             redirectUri: string;
             codeChallenge: string;
             codeChallengeMethod?: 'S256' | 'plain';
             state?: string;
             scope?: string;
         }): Promise<string>;
         /**
          * Exchange an auth code for tokens, using the PKCE verifier.
          */
         exchangeAuthCode(input: {
             code: string;
             redirectUri: string;
             codeVerifier: string;
         }): Promise<TokenResponse>;
         deviceStart(): Promise<DeviceStartResponse>;
         devicePoll(device_code: string, intervalSec?: number): Promise<TokenResponse>;
         /**
          * One call convenience for Device Code flow.
          *
          * @remarks
          * Polling interval will be the MAX of intervalSec and Mint interval.
          * @param intervalSec Desired polling interval in seconds.
          * @returns The start fields and helpers to poll or cancel.
          */
         startDeviceAuth(intervalSec?: number): Promise<DeviceStartResponse & {
             poll: () => Promise<TokenResponse>;
             cancel: () => void;
         }>;
         refresh(refresh_token: string): Promise<TokenResponse>;
         passwordGrant(username: string, password: string): Promise<TokenResponse>;
         /**
          * Fire and forget token fan out. Any listener errors are logged inside safeCallback. Nothing
          * thrown here will come from listeners.
          */
         private handleTokens;
         private toForm;
         private postFormStrict;
         private postFormLoose;
         private sleep;
     }

     export declare type OIDCAuthOptions = {
         clientId?: string;
         scope?: string;
         logger?: Logger;
         onTokens?: (t: TokenResponse) => void | Promise<void>;
     };

     export declare type OIDCConfig = {
         issuer: string;
         authorization_endpoint?: string;
         token_endpoint: string;
         device_authorization_endpoint?: string;
     };

     export declare type OnCountersReserved = (info: OperationCounters) => void;

     /**
      * Counter summary for an operation.
      *
      * - `keysetId` - of the transaction.
      * - `start` - beginning of reservation.
      * - `count` - number of reservations.
      * - `next` - counter available after reservation.
      *
      * @example // Start: 5, Count: 3 => 5,6,7. Next: 8.
      */
     export declare type OperationCounters = {
         keysetId: string;
         start: number;
         count: number;
         next: number;
     };

     /**
      * Output config for send/swap operations.
      *
      * @remarks
      * Defines types for sent and kept proofs.
      *
      * - `send`: Required for recipient proofs.
      * - `keep`: Optional; defaults to wallet defaultOutputType policy.
      *
      * @example
      *
      *     const config: OutputConfig = {
      *     	send: { type: 'random', denominations: [1, 2] },
      *     	keep: { type: 'deterministic', counter: 0 },
      *     };
      *     await wallet.send(3, proofs, config, { includeFees: true });
      */
     export declare interface OutputConfig {
         send: OutputType;
         keep?: OutputType;
     }

     export declare class OutputData implements OutputDataLike {
         blindedMessage: SerializedBlindedMessage;
         blindingFactor: bigint;
         secret: Uint8Array;
         constructor(blindedMessage: SerializedBlindedMessage, blidingFactor: bigint, secret: Uint8Array);
         toProof(sig: SerializedBlindedSignature, keyset: MintKeys | Keyset): Proof;
         static createP2PKData(p2pk: {
             pubkey: string | string[];
             locktime?: number;
             refundKeys?: string[];
             requiredSignatures?: number;
             requiredRefundSignatures?: number;
         }, amount: number, keyset: MintKeys | Keyset, customSplit?: number[]): OutputData[];
         static createSingleP2PKData(p2pk: {
             pubkey: string | string[];
             locktime?: number;
             refundKeys?: string[];
             requiredSignatures?: number;
             requiredRefundSignatures?: number;
         }, amount: number, keysetId: string): OutputData;
         static createRandomData(amount: number, keyset: MintKeys | Keyset, customSplit?: number[]): OutputData[];
         static createSingleRandomData(amount: number, keysetId: string): OutputData;
         static createDeterministicData(amount: number, seed: Uint8Array, counter: number, keyset: MintKeys | Keyset, customSplit?: number[]): OutputData[];
         static createSingleDeterministicData(amount: number, seed: Uint8Array, counter: number, keysetId: string): OutputData;
         /**
          * Calculates the sum of amounts in an array of OutputDataLike objects.
          *
          * @param outputs Array of OutputDataLike objects.
          * @returns The total sum of amounts.
          */
         static sumOutputAmounts(outputs: OutputDataLike[]): number;
     }

     export declare type OutputDataFactory = (amount: number, keys: MintKeys | Keyset) => OutputDataLike;

     export declare interface OutputDataLike {
         blindedMessage: SerializedBlindedMessage;
         blindingFactor: bigint;
         secret: Uint8Array;
         toProof: (signature: SerializedBlindedSignature, keyset: MintKeys | Keyset) => Proof;
     }

     /**
      * Configuration for generating blinded message outputs.
      *
      * @remarks
      * A discriminated union based on the `type` field.
      * @example
      *
      *     // Random with custom splits
      *     const random: OutputType = { type: 'random', denominations: [1, 2, 4] };
      *     // Deterministic
      *     const deterministic: OutputType = { type: 'deterministic', counter: 0 };
      */
     export declare type OutputType = ({
         /**
          * Random blinding factors (default behavior).
          */
         type: 'random';
     } & SharedOutputTypeProps) | ({
         /**
          * Deterministic outputs based on a counter.
          *
          * @remarks
          * Counter: 0 means “auto-assign from wallet’s CounterSource”. Any positive value is used as
          * the exact starting counter without reservation. Negative values are invalid.
          */
         type: 'deterministic';
         counter: number;
     } & SharedOutputTypeProps) | ({
         /**
          * Pay-to-public-key (P2PK) outputs.
          *
          * @see P2PKOptions
          */
         type: 'p2pk';
         options: P2PKOptions;
     } & SharedOutputTypeProps) | ({
         /**
          * Factory-generated OutputData.
          *
          * @remarks
          * Outputs count from denominations or basic split.
          * @see OutputDataFactory
          */
         type: 'factory';
         factory: OutputDataFactory;
     } & SharedOutputTypeProps) | {
         /**
          * Pre-created OutputData, bypassing splitting.
          */
         type: 'custom';
         data: OutputData[];
     };

     export declare class P2PKBuilder {
         private lockSet;
         private refundSet;
         private locktime?;
         private nSigs?;
         private nSigsRefund?;
         addLockPubkey(pk: string | string[]): this;
         addRefundPubkey(pk: string | string[]): this;
         lockUntil(when: Date | number): this;
         requireLockSignatures(n: number): this;
         requireRefundSignatures(n: number): this;
         toOptions(): P2PKOptions;
         static fromOptions(opts: P2PKOptions): P2PKBuilder;
     }

     /**
      * Options for configuring P2PK (Pay-to-Public-Key) locked proofs according to NUT-11.
      */
     export declare type P2PKOptions = {
         pubkey: string | string[];
         locktime?: number;
         refundKeys?: string[];
         requiredSignatures?: number;
         requiredRefundSignatures?: number;
     };

     /**
      * P2PK witness.
      */
     export declare type P2PKWitness = {
         /**
          * An array of signatures in hex format.
          */
         signatures?: string[];
     };

     export declare const parseP2PKSecret: (secret: string | Uint8Array) => Secret;

     /**
      * Response from the mint after requesting a melt quote.
      */
     export declare type PartialMeltQuoteResponse = {
         /**
          * Quote ID.
          */
         quote: string;
         /**
          * Amount to be melted.
          */
         amount: number;
         /**
          * Fee reserve to be added to the amount.
          */
         fee_reserve: number;
         /**
          * State of the melt quote.
          */
         state: MeltQuoteState;
         /**
          * Timestamp of when the quote expires.
          */
         expiry: number;
         /**
          * Preimage of the paid invoice. is null if it the invoice has not been paid yet. can be null,
          * depending on which LN-backend the mint uses.
          */
         payment_preimage: string | null;
         /**
          * Return/Change from overpaid fees. This happens due to Lighting fee estimation being inaccurate.
          */
         change?: SerializedBlindedSignature[];
         /**
          * Payment request for the melt quote.
          */
         request?: string;
         /**
          * Unit of the melt quote.
          */
         unit?: string;
     } & ApiError;

     /**
      * Response from the mint after requesting a mint.
      */
     export declare type PartialMintQuoteResponse = {
         /**
          * Payment request.
          */
         request: string;
         /**
          * Quote ID.
          */
         quote: string;
         /**
          * State of the mint quote.
          */
         state: MintQuoteState;
         /**
          * Timestamp of when the quote expires.
          */
         expiry: number;
         /**
          * Public key the quote is locked to.
          */
         pubkey?: string;
         /**
          * Unit of the quote.
          */
         unit?: string;
         /**
          * Amount requested for mint quote.
          */
         amount?: number;
     } & ApiError;

     declare class PaymentRequest_2 {
         transport?: PaymentRequestTransport[] | undefined;
         id?: string | undefined;
         amount?: number | undefined;
         unit?: string | undefined;
         mints?: string[] | undefined;
         description?: string | undefined;
         singleUse: boolean;
         nut10?: NUT10Option | undefined;
         constructor(transport?: PaymentRequestTransport[] | undefined, id?: string | undefined, amount?: number | undefined, unit?: string | undefined, mints?: string[] | undefined, description?: string | undefined, singleUse?: boolean, nut10?: NUT10Option | undefined);
         toRawRequest(): RawPaymentRequest;
         toEncodedRequest(): string;
         getTransport(type: PaymentRequestTransportType): PaymentRequestTransport | undefined;
         static fromRawRequest(rawPaymentRequest: RawPaymentRequest): PaymentRequest_2;
         static fromEncodedRequest(encodedRequest: string): PaymentRequest_2;
     }
     export { PaymentRequest_2 as PaymentRequest }

     export declare type PaymentRequestTransport = {
         type: PaymentRequestTransportType;
         target: string;
         tags?: string[][];
     };

     export declare enum PaymentRequestTransportType {
         POST = "post",
         NOSTR = "nostr"
     }

     export declare function pointFromBytes(bytes: Uint8Array): WeierstrassPoint<bigint>;

     export declare function pointFromHex(hex: string): WeierstrassPoint<bigint>;

     /**
      * Request to mint at /v1/restore endpoint.
      */
     export declare type PostRestorePayload = {
         outputs: SerializedBlindedMessage[];
     };

     /**
      * Response from mint at /v1/restore endpoint.
      */
     export declare type PostRestoreResponse = {
         outputs: SerializedBlindedMessage[];
         signatures: SerializedBlindedSignature[];
     };

     /**
      * Represents a single Cashu proof.
      */
     export declare type Proof = {
         /**
          * Keyset id, used to link proofs to a mint an its MintKeys.
          */
         id: string;
         /**
          * Amount denominated in Satoshis. Has to match the amount of the mints signing key.
          */
         amount: number;
         /**
          * The initial secret that was (randomly) chosen for the creation of this proof.
          */
         secret: string;
         /**
          * The unblinded signature for this secret, signed by the mints private key.
          */
         C: string;
         /**
          * DLEQ proof.
          */
         dleq?: SerializedDLEQ;
         /**
          * The witness for this proof.
          */
         witness?: string | P2PKWitness | HTLCWitness;
     };

     /**
      * Entries of CheckStateResponse with state of the proof.
      */
     export declare type ProofState = {
         Y: string;
         state: CheckStateEnum;
         witness: string | null;
     };

     export declare type RawMintKeys = {
         [k: string]: Uint8Array;
     };

     export declare type RawNUT10Option = {
         k: string;
         d: string;
         t: string[][];
     };

     export declare type RawPaymentRequest = {
         i?: string;
         a?: number;
         u?: string;
         s?: boolean;
         m?: string[];
         d?: string;
         t?: RawTransport[];
         nut10?: RawNUT10Option;
     };

     export declare type RawProof = {
         C: WeierstrassPoint<bigint>;
         secret: Uint8Array;
         amount: number;
         id: string;
         witness?: P2PKWitness;
     };

     export declare type RawTransport = {
         t: PaymentRequestTransportType;
         a: string;
         g?: string[][];
     };

     /**
      * Builder for receiving a token.
      *
      * @remarks
      * If you do not call a type method, the wallet’s policy default is used.
      * @example
      *
      *     const proofs = await wallet.ops
      *     	.receive(token)
      *     	.asDeterministic() // counter 0 auto reserves
      *     	.requireDleq(true)
      *     	.run();
      */
     export declare class ReceiveBuilder {
         private wallet;
         private token;
         private outputType?;
         private config;
         constructor(wallet: Wallet, token: Token | string);
         /**
          * Use random blinding for the received outputs.
          *
          * @remarks
          * If denoms specified, proofsWeHave() will have no effect.
          * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
          */
         asRandom(denoms?: number[]): this;
         /**
          * Use deterministic outputs for the received proofs.
          *
          * @remarks
          * If denoms specified, proofsWeHave() will have no effect.
          * @param counter Starting counter. Zero means auto reserve using the wallet’s CounterSource.
          * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
          */
         asDeterministic(counter?: number, denoms?: number[]): this;
         /**
          * Use P2PK locked outputs for the received proofs.
          *
          * @remarks
          * If denoms specified, proofsWeHave() will have no effect.
          * @param options NUT 11 options like pubkey and locktime.
          * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
          */
         asP2PK(options: P2PKOptions, denoms?: number[]): this;
         /**
          * Use a factory to generate OutputData for received proofs.
          *
          * @remarks
          * If denoms specified, proofsWeHave() will have no effect.
          * @param factory OutputDataFactory used to produce blinded messages.
          * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
          */
         asFactory(factory: OutputDataFactory, denoms?: number[]): this;
         /**
          * Provide pre created OutputData for received proofs.
          *
          * @param data Fully formed OutputData for the final amount.
          */
         asCustom(data: OutputData[]): this;
         /**
          * Use a specific keyset for the operation.
          *
          * @param id Keyset id to use for mint keys and fee lookup.
          */
         keyset(id: string): this;
         /**
          * Require all incoming proofs to have a valid DLEQ for the selected keyset.
          *
          * @param on When true, proofs without DLEQ are rejected.
          */
         requireDleq(on?: boolean): this;
         /**
          * Private key used to sign P2PK locked incoming proofs.
          *
          * @param k Single key or array of multisig keys.
          */
         privkey(k: string | string[]): this;
         /**
          * Provide existing proofs to help optimise denomination selection.
          *
          * @remarks
          * Has no effect if denominations (custom split) was specified.
          * @param p Proofs currently held by the wallet, used to hit denomination targets.
          */
         proofsWeHave(p: Proof[]): this;
         /**
          * Receive a callback once counters are atomically reserved for deterministic outputs.
          *
          * @param cb Called with OperationCounters when counters are reserved.
          */
         onCountersReserved(cb: OnCountersReserved): this;
         run(): Promise<Proof[]>;
     }

     /**
      * Configuration for receive operations.
      */
     export declare type ReceiveConfig = {
         keysetId?: string;
         privkey?: string | string[];
         requireDleq?: boolean;
         proofsWeHave?: Proof[];
         onCountersReserved?: OnCountersReserved;
     };

     export declare type RequestArgs = {
         endpoint: string;
         requestBody?: Record<string, unknown>;
         headers?: Record<string, string>;
         logger?: Logger;
     };

     export declare type RequestFn = <T = unknown>(args: RequestOptions) => Promise<T>;

     export declare type RequestOptions = RequestArgs & Omit<RequestInit, 'body' | 'headers'>;

     export declare type RestoreConfig = {
         keysetId?: string;
     };

     export declare type RpcSubKinds = 'bolt11_mint_quote' | 'bolt11_melt_quote' | 'proof_state';

     export declare function sanitizeUrl(url: string): string;

     export declare type Secret = [WellKnownSecret, SecretData];

     export declare type SecretData = {
         nonce: string;
         data: string;
         tags?: string[][];
     };

     export declare type SecretsPolicy = 'auto' | 'deterministic' | 'random';

     export declare type SelectProofs = (proofs: Proof[], amountToSend: number, keyChain: KeyChain, includeFees?: boolean, exactMatch?: boolean, logger?: Logger) => SendResponse;

     export declare const selectProofsRGLI: SelectProofs;

     /**
      * Builder for composing a send or swap.
      *
      * @remarks
      * If you only customise the send side, keep is omitted so the wallet may still attempt an offline
      * exact match selection where possible.
      * @example
      *
      *     const { keep, send } = await wallet.ops
      *     	.send(5, proofs)
      *     	.asDeterministic() // counter 0 means auto reserve via CounterSource
      *     	.keepAsRandom()
      *     	.includeFees(true) // sender pays receiver’s future spend fee
      *     	.run();
      */
     export declare class SendBuilder {
         private wallet;
         private amount;
         private proofs;
         private sendOT?;
         private keepOT?;
         private config;
         private offlineExact?;
         private offlineClose?;
         constructor(wallet: Wallet, amount: number, proofs: Proof[]);
         /**
          * Use random blinding for the sent outputs.
          *
          * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
          */
         asRandom(denoms?: number[]): this;
         /**
          * Use deterministic outputs for the sent proofs.
          *
          * @param counter Starting counter. Zero means auto reserve using the wallet’s CounterSource.
          * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
          */
         asDeterministic(counter?: number, denoms?: number[]): this;
         /**
          * Use P2PK locked outputs for the sent proofs.
          *
          * @param options NUT 11 options like pubkey and locktime.
          * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
          */
         asP2PK(options: P2PKOptions, denoms?: number[]): this;
         /**
          * Use a factory to generate OutputData for the sent proofs.
          *
          * @param factory OutputDataFactory used to produce blinded messages.
          * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
          */
         asFactory(factory: OutputDataFactory, denoms?: number[]): this;
         /**
          * Provide pre created OutputData for the sent proofs.
          *
          * @param data Fully formed OutputData. Their amounts must sum to the send amount, otherwise the
          *   wallet will throw.
          */
         asCustom(data: OutputData[]): this;
         /**
          * Use random blinding for change outputs.
          *
          * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
          */
         keepAsRandom(denoms?: number[]): this;
         /**
          * Use deterministic outputs for change.
          *
          * @param counter Starting counter. Zero means auto reserve using the wallet’s CounterSource.
          * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
          */
         keepAsDeterministic(counter?: number, denoms?: number[]): this;
         /**
          * Use P2PK locked change (NUT 11).
          *
          * @param options Locking options applied to the kept proofs.
          * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
          */
         keepAsP2PK(options: P2PKOptions, denoms?: number[]): this;
         /**
          * Use a factory to generate OutputData for change.
          *
          * @param factory OutputDataFactory used to produce blinded messages.
          * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
          */
         keepAsFactory(factory: OutputDataFactory, denoms?: number[]): this;
         /**
          * Provide pre created OutputData for change.
          *
          * @param data Fully formed OutputData for the keep (change) amount.
          */
         keepAsCustom(data: OutputData[]): this;
         /**
          * Make the sender cover the receiver’s future spend fee.
          *
          * @param on When true, include fees in the sent amount. Default true if called.
          */
         includeFees(on?: boolean): this;
         /**
          * Use a specific keyset for the operation.
          *
          * @param id Keyset id to use for mint keys and fee lookup.
          */
         keyset(id: string): this; /**
         * Provide existing proofs to help optimise denomination selection.
         *
         * @remarks
         * Has no effect if denominations (custom split) was specified.
         * @param p Proofs currently held by the wallet, used to hit denomination targets.
         */
         proofsWeHave(p: Proof[]): this;
         /**
          * Receive a callback once counters are atomically reserved for deterministic outputs.
          *
          * @param cb Called with OperationCounters when counters are reserved.
          */
         onCountersReserved(cb: OnCountersReserved): this;
         /**
          * Force a pure offline, exact match selection. No mint calls are made. If an exact match cannot
          * be found, this throws.
          *
          * @param requireDleq Only consider proofs with a DLEQ when true.
          */
         offlineExactOnly(requireDleq?: boolean): this;
         /**
          * Force a pure offline selection that allows a close match, overspend permitted per wallet RGLI.
          * No mint calls are made. Returns the best offline subset found, or throws if funds are
          * insufficient.
          *
          * @param requireDleq Only consider proofs with a DLEQ when true.
          */
         offlineCloseMatch(requireDleq?: boolean): this;
         /**
          * Execute the send or swap.
          *
          * @returns The split result with kept and sent proofs.
          */
         run(): Promise<SendResponse>;
     }

     /**
      * Configuration for send operations.
      */
     export declare type SendConfig = {
         keysetId?: string;
         includeFees?: boolean;
         proofsWeHave?: Proof[];
         onCountersReserved?: OnCountersReserved;
     };

     /**
      * Configuration for offline send operations.
      */
     export declare type SendOfflineConfig = {
         requireDleq?: boolean;
         includeFees?: boolean;
         exactMatch?: boolean;
     };

     /**
      * Response after sending.
      */
     export declare type SendResponse = {
         /**
          * Proofs that exceeded the needed amount.
          */
         keep: Proof[];
         /**
          * Proofs to be sent, matching the chosen amount.
          */
         send: Proof[];
         serialized?: Array<{
             proof: Proof;
             keep: boolean;
         }>;
     };

     /**
      * Blinded message for sending to the mint.
      */
     export declare type SerializedBlindedMessage = {
         /**
          * Amount.
          */
         amount: number;
         /**
          * Blinded message.
          */
         B_: string;
         /**
          * Keyset id.
          */
         id: string;
     };

     /**
      * Blinded signature as it is received from the mint.
      */
     export declare type SerializedBlindedSignature = {
         /**
          * Keyset id for indicating which public key was used to sign the blinded message.
          */
         id: string;
         /**
          * Amount denominated in Satoshi.
          */
         amount: number;
         /**
          * Blinded signature.
          */
         C_: string;
         /**
          * DLEQ Proof.
          */
         dleq?: SerializedDLEQ;
     };

     export declare type SerializedDLEQ = {
         s: string;
         e: string;
         r?: string;
     };

     export declare type SerializedMintKeys = {
         [k: string]: string;
     };

     export declare type SerializedProof = {
         C: string;
         secret: string;
         amount: number;
         id: string;
         witness?: string;
     };

     export declare function serializeMintKeys(mintKeys: RawMintKeys): SerializedMintKeys;

     export declare const serializeProof: (proof: RawProof) => SerializedProof;

     /**
      * An object containing any custom settings that you want to apply to the global fetch method.
      *
      * @param options See possible options here:
      *   https://developer.mozilla.org/en-US/docs/Web/API/fetch#options.
      */
     export declare function setGlobalRequestOptions(options: Partial<RequestOptions>): void;

     /**
      * Shared properties for most `OutputType` variants (except 'custom').
      */
     export declare interface SharedOutputTypeProps {
         /**
          * Optional custom amounts for splitting outputs.
          *
          * @default Uses basic splitAmount if omitted.
          */
         denominations?: number[];
     }

     export declare type SigFlag = 'SIG_INPUTS' | 'SIG_ALL';

     export declare const signBlindedMessage: (B_: string, privateKey: PrivKey) => string;

     export declare function signMintQuote(privkey: string, quote: string, blindedMessages: SerializedBlindedMessage[]): string;

     /**
      * Signs a single proof with the provided private key if required NB: Will only sign if the proof
      * requires a signature from the key.
      *
      * @param proof - A proof to sign.
      * @param privateKey - A single private key.
      * @throws Error if signature is not required or proof is already signed.
      */
     export declare const signP2PKProof: (proof: Proof, privateKey: string) => Proof;

     /**
      * Signs proofs with provided private key(s) if required NB: Will only sign if the proof requires a
      * signature from the key.
      *
      * @param proofs - An array of proofs to sign.
      * @param privateKey - A single private key or array of private keys.
      * @param logger - Optional logger (default: NULL_LOGGER)
      */
     export declare const signP2PKProofs: (proofs: Proof[], privateKey: string | string[], logger?: Logger) => Proof[];

     export declare const signP2PKSecret: (secret: string, privateKey: PrivKey) => string;

     export declare function sortProofsById(proofs: Proof[]): Proof[];

     /**
      * Splits the amount into denominations of the provided keyset.
      *
      * @remarks
      * Partial splits will be filled up to value using minimum splits required. Sorting is only applied
      * if a fill was made - exact custom splits are always returned in the same order.
      * @param value Amount to split.
      * @param keyset Keys to look up split amounts.
      * @param split? Optional custom split amounts.
      * @param order? Optional order for split amounts (if fill was required)
      * @returns Array of split amounts.
      * @throws Error if split sum is greater than value or mint does not have keys for requested split.
      */
     export declare function splitAmount(value: number, keyset: Keys, split?: number[], order?: 'desc' | 'asc'): number[];

     /**
      * Removes all traces of DLEQs from a list of proofs.
      *
      * @param proofs The list of proofs that dleq should be stripped from.
      */
     export declare function stripDleq(proofs: Proof[]): Array<Omit<Proof, 'dleq'>>;

     export declare type SubscribeOpts = {
         signal?: AbortSignal;
     };

     export declare type SubscriptionCanceller = () => void;

     export declare function sumProofs(proofs: Proof[]): number;

     /**
      * Ecash to other MoE swap method, displayed in @type {GetInfoResponse}
      */
     export declare type SwapMethod = {
         method: string;
         unit: string;
         min_amount: number;
         max_amount: number;
         options?: {
             description?: boolean;
         };
     };

     /**
      * Payload that needs to be sent to the mint when performing a split action.
      */
     export declare type SwapPayload = {
         /**
          * Inputs to the split operation.
          */
         inputs: Proof[];
         /**
          * Outputs (blinded messages) to be signed by the mint.
          */
         outputs: SerializedBlindedMessage[];
     };

     /**
      * Response from the mint after performing a split action.
      */
     export declare type SwapResponse = {
         /**
          * Represents the outputs after the split.
          */
         signatures: SerializedBlindedSignature[];
     } & ApiError;

     /**
      * Includes all data required to swap inputs for outputs and construct proofs from them.
      */
     export declare type SwapTransaction = {
         /**
          * Payload that will be sent to the mint for a swap.
          */
         payload: SwapPayload;
         /**
          * Blinding data required to construct proofs.
          */
         outputData: OutputData[];
         /**
          * List of booleans to determine which proofs to keep.
          */
         keepVector: boolean[];
         /**
          * Indices that can be used to restore original output data.
          */
         sortedIndices: number[];
     };

     /**
      * A Cashu token.
      */
     export declare type Token = {
         /**
          * The mints URL.
          */
         mint: string;
         /**
          * A list of proofs.
          */
         proofs: Proof[];
         /**
          * A message to send along with the token.
          */
         memo?: string;
         /**
          * The unit of the token.
          */
         unit?: string;
     };

     export declare type TokenResponse = {
         access_token?: string;
         token_type?: string;
         expires_in?: number;
         refresh_token?: string;
         id_token?: string;
         scope?: string;
         error?: string;
         error_description?: string;
     };

     export declare function unblindSignature(C_: WeierstrassPoint<bigint>, r: bigint, A: WeierstrassPoint<bigint>): WeierstrassPoint<bigint>;

     export declare const verifyDLEQProof: (dleq: DLEQ, B_: WeierstrassPoint<bigint>, C_: WeierstrassPoint<bigint>, A: WeierstrassPoint<bigint>) => boolean;

     export declare const verifyDLEQProof_reblind: (secret: Uint8Array, // secret
     dleq: DLEQ, C: WeierstrassPoint<bigint>, // unblinded e-cash signature point
     A: WeierstrassPoint<bigint>) => boolean;

     /**
      * Check that the keyset hashes to the specified ID.
      *
      * @deprecated Now part of Keyset class.
      * @param keys The keyset to be verified.
      * @returns True if the verification was successful, false otherwise.
      * @throws Error if the keyset ID version is unrecognized.
      */
     export declare function verifyKeysetId(keys: MintKeys): boolean;

     export declare function verifyMintQuoteSignature(pubkey: string, quote: string, blindedMessages: SerializedBlindedMessage[], signature: string): boolean;

     /**
      * Verifies a Schnorr signature on a P2PK secret.
      *
      * @param signature - The Schnorr signature (hex-encoded).
      * @param secret - The Secret to verify.
      * @param pubkey - The Cashu P2PK public key (hex-encoded, X-only or with 02/03 prefix).
      * @returns {boolean} True if the signature is valid, false otherwise.
      */
     export declare const verifyP2PKSecretSignature: (signature: string, secret: string, pubkey: string) => boolean;

     export declare const verifyP2PKSig: (proof: Proof) => boolean;

     export declare const verifyP2PKSigOutput: (output: BlindedMessage, publicKey: string) => boolean;

     export declare function verifyProof(proof: RawProof, privKey: Uint8Array): boolean;

     /**
      * Class that represents a Cashu wallet.
      *
      * @remarks
      * This class should act as the entry point for this library. Can be instantiated with a mint
      * instance or mint url.
      * @example
      *
      * ```typescript
      * import { Wallet } from '@cashu/cashu-ts';
      * const wallet = new Wallet('http://localhost:3338', { unit: 'sat' });
      * await wallet.loadMint(); // Initialize mint info, keysets, and keys
      * // Wallet is now ready to use, eg:
      * const proofs = [...]; // your array of unspent proofs
      * const { keep, send } = await wallet.send(32, proofs);
      * ```
      */
     export declare class Wallet {
         /**
          * Mint instance - allows direct calls to the mint.
          */
         readonly mint: Mint;
         /**
          * KeyChain instance - contains wallet keysets/keys.
          */
         readonly keyChain: KeyChain;
         /**
          * Entry point for the builder.
          *
          * @example
          *
          *     const { keep, send } = await wallet.ops
          *     	.send(5, proofs)
          *     	.asDeterministic() // counter: 0 = auto
          *     	.keepAsRandom()
          *     	.includeFees(true)
          *     	.run();
          *
          *     const proofs = await wallet.ops
          *     	.receive(token)
          *     	.asDeterministic()
          *     	.keyset(wallet.keysetId)
          *     	.run();
          */
         readonly ops: WalletOps;
         /**
          * Convenience wrapper for events.
          */
         readonly on: WalletEvents;
         /**
          * Developer-friendly counters API.
          */
         readonly counters: WalletCounters;
         private _seed;
         private _unit;
         private _mintInfo;
         private _denominationTarget;
         private _secretsPolicy;
         private _counterSource;
         private _boundKeysetId;
         private _selectProofs;
         private _logger;
         /**
          * Create a wallet for a given mint and unit. Call `loadMint` before use.
          *
          * Binding, if `options.keysetId` is omitted, the wallet binds to the cheapest active keyset for
          * this unit during `loadMint`. The keychain only loads keysets for this unit.
          *
          * Caching, to preload, provide both `keysets` and `keys`, otherwise the cache is ignored.
          *
          * Deterministic secrets, pass `bip39seed` and optionally `secretsPolicy`. Deterministic outputs
          * reserve counters from `counterSource`, or an ephemeral in memory source if not supplied.
          * `initialCounter` applies only with a supplied `keysetId` and the ephemeral source.
          *
          * Splitting, `denominationTarget` guides proof splits, default is 3. Override coin selection with
          * `selectProofs` if needed. Logging defaults to a null logger.
          *
          * @param mint Mint instance or URL.
          * @param options Optional settings.
          * @param options.unit Wallet unit, default 'sat'.
          * @param options.keysetId Bind to this keyset id, else bind on `loadMint`.
          * @param options.bip39seed BIP39 seed for deterministic secrets.
          * @param options.secretsPolicy Secrets policy, default 'auto'.
          * @param options.counterSource Counter source for deterministic outputs. If provided, this takes
          *   precedence over counterInit. Use when you need persistence across processes or devices.
          * @param options.counterInit Seed values for the built-in EphemeralCounterSource. Ignored if
          *   counterSource is also provided.
          * @param options.keys Cached keys for this unit, only used when `keysets` is also provided.
          * @param options.keysets Cached keysets for this unit, only used when `keys` is also provided.
          * @param options.mintInfo Optional cached mint info.
          * @param options.denominationTarget Target proofs per denomination, default 3.
          * @param options.selectProofs Custom proof selection function.
          * @param options.logger Logger instance, default null logger.
          */
         constructor(mint: Mint | string, options?: {
             unit?: string;
             authProvider?: AuthProvider;
             keysetId?: string;
             bip39seed?: Uint8Array;
             secretsPolicy?: SecretsPolicy;
             counterSource?: CounterSource;
             counterInit?: Record<string, number>;
             keys?: MintKeys[] | MintKeys;
             keysets?: MintKeyset[];
             mintInfo?: GetInfoResponse;
             denominationTarget?: number;
             selectProofs?: SelectProofs;
             logger?: Logger;
         });
         private fail;
         private failIf;
         private failIfNullish;
         private safeCallback;
         /**
          * Load mint information, keysets, and keys. Must be called before using other methods.
          *
          * @param forceRefresh If true, re-fetches data even if cached.
          * @throws If fetching mint info, keysets, or keys fails.
          */
         loadMint(forceRefresh?: boolean): Promise<void>;
         /**
          * Get the wallet's unit.
          *
          * @returns The unit (e.g., 'sat').
          */
         get unit(): string;
         /**
          * Get information about the mint.
          *
          * @remarks
          * Returns cached mint info. Call `loadMint` first to initialize the wallet.
          * @returns Mint info.
          * @throws If mint info is not initialized.
          */
         getMintInfo(): MintInfo;
         /**
          * The keyset ID bound to this wallet instance.
          */
         get keysetId(): string;
         /**
          * Gets the requested keyset or the keyset bound to the wallet.
          *
          * @remarks
          * This method enforces wallet policies. If `id` is omitted, it returns the keyset bound to this
          * wallet, including validation that:
          *
          * - The keyset exists in the keychain,
          * - The unit matches the wallet's unit,
          * - Keys are loaded for that keyset.
          *
          * Contrast with `keyChain.getKeyset(id?)`, which, when called without an id, returns the cheapest
          * active keyset for the unit, ignoring the wallet binding.
          * @param id Optional keyset id to resolve. If omitted, the wallet's bound keyset is used.
          * @returns The resolved `Keyset`.
          * @throws If the keyset is not found, has no keys, or its unit differs from the wallet.
          */
         getKeyset(id?: string): Keyset;
         get logger(): Logger;
         private reserveFor;
         private countersNeeded;
         private addCountersToOutputTypes;
         /**
          * Bind this wallet to a specific keyset id.
          *
          * @remarks
          * This changes the default keyset used by all operations that do not explicitly pass a keysetId.
          * The method validates that the keyset exists in the keychain, matches the wallet unit, and has
          * keys loaded.
          *
          * Typical uses:
          *
          * 1. After loadMint, to pin the wallet to a particular active keyset.
          * 2. After a refresh, to rebind deliberately rather than falling back to cheapest.
          *
          * @param id The keyset identifier to bind to.
          * @throws If keyset not found, if it has no keys loaded, or if its unit is not the wallet unit.
          */
         bindKeyset(id: string): void;
         /**
          * Creates a new Wallet bound to a different keyset, sharing the same CounterSource.
          *
          * Use this to operate on multiple keysets concurrently without mutating your original wallet.
          * Counters remain monotonic across instances because the same CounterSource is reused.
          *
          * Do NOT pass a fresh CounterSource for the same seed unless you know exactly why. Reusing
          * counters can recreate secrets that a mint will reject.
          *
          * @param id The keyset identifier to bind to.
          * @throws If keyset not found, if it has no keys loaded, or if its unit is not the wallet unit.
          */
         withKeyset(id: string, opts?: {
             counterSource?: CounterSource;
         }): Wallet;
         /**
          * Returns the default OutputType for this wallet, based on its configured secrets policy
          * (options?.secretsPolicy) and seed state.
          *
          * - If the secrets policy is 'random', returns { type: 'random' }.
          * - If the policy is 'deterministic', requires a seed and returns { type: 'deterministic', counter:
          *   0 }. Counter 0 is a flag meaning "auto-increment from current state".
          * - If no explicit policy is set, falls back to:
          *
          *   - Deterministic if a seed is present.
          *   - Random if no seed is present.
          *
          * @returns An OutputType object describing the default output strategy.
          * @throws Error if the policy is 'deterministic' but no seed has been set.
          */
         defaultOutputType(): OutputType;
         /**
          * Configures output denominations with fee adjustments and optimization.
          *
          * @remarks
          * If 'custom' outputType, data outputs MUST sum to the amount. Other outputTypes may supply
          * denominations. If no denominations are passed in, they will be calculated based on proofsWeHave
          * or the default split. If partial denominations are passed in, the balance will be added using
          * default split. Additional denominations to cover fees will then be added if required.
          * @param amount The total amount for outputs.
          * @param keyset The mint keyset.
          * @param outputType The output configuration.
          * @param includeFees Whether to include swap fees in the output amount.
          * @param proofsWeHave Optional proofs for optimizing denomination splitting.
          * @returns OutputType with required denominations.
          */
         private configureOutputs;
         /**
          * Sum total implied by a prepared OutputType. Note: Empty denomination is valid (e.g: zero
          * change).
          */
         private preparedTotal;
         /**
          * Generates blinded messages based on the specified output type.
          *
          * @param amount The total amount for outputs.
          * @param keyset The mint keys.
          * @param outputType The output configuration.
          * @returns Prepared output data.
          */
         private createOutputData;
         /**
          * Creates a swap transaction with sorted outputs for privacy. This prevents a mint working out
          * which proofs will be sent or kept.
          *
          * @param inputs Prepared input proofs.
          * @param keepOutputs Outputs to keep (change or receiver's proofs).
          * @param sendOutputs Outputs to send (optional, default empty for receive/mint).
          * @returns Swap transaction with payload and metadata for processing signatures.
          */
         private createSwapTransaction;
         /**
          * Receive a token (swaps with mint for new proofs)
          *
          * @example
          *
          * ```typescript
          * const result = await wallet.receive(
          * 	token,
          * 	{ includeFees: true },
          * 	{ type: 'deterministic', counter: 0 },
          * );
          * ```
          *
          * @param token Token string or decoded token.
          * @param config Optional receive config.
          * @param outputType Configuration for proof generation. Defaults to wallet.defaultOutputType().
          * @returns Newly minted proofs.
          */
         receive(token: Token | string, config?: ReceiveConfig, outputType?: OutputType): Promise<Proof[]>;
         /**
          * Sends proofs of a given amount from provided proofs.
          *
          * @remarks
          * If proofs are P2PK-locked to your public key, call signP2PKProofs first to sign them. The
          * default config uses exact match selection, and does not includeFees or requireDleq. Because the
          * send is offline, the user will unlock the signed proofs when they receive them online.
          * @param amount Amount to send.
          * @param proofs Array of proofs (must sum >= amount; pre-sign if P2PK-locked).
          * @param config Optional parameters for the send.
          * @returns SendResponse with keep/send proofs.
          * @throws Throws if the send cannot be completed offline.
          */
         sendOffline(amount: number, proofs: Proof[], config?: SendOfflineConfig): SendResponse;
         /**
          * Send proofs with online swap if necessary.
          *
          * @remarks
          * If proofs are P2PK-locked to your public key, call signP2PKProofs first to sign them.
          * @example
          *
          * ```typescript
          * // Simple send
          * const result = await wallet.send(5, proofs);
          *
          * // With a SendConfig
          * const result = await wallet.send(5, proofs, { includeFees: true });
          *
          * // With Custom output configuration
          * const customConfig: OutputConfig = {
          * 	send: { type: 'p2pk', options: { pubkey: '...' } },
          * 	keep: { type: 'deterministic', counter: 0 },
          * };
          * const customResult = await wallet.send(5, proofs, { includeFees: true }, customConfig);
          * ```
          *
          * @param amount Amount to send (receiver gets this net amount).
          * @param proofs Array of proofs to split.
          * @param config Optional parameters for the swap.
          * @returns SendResponse with keep/send proofs.
          * @throws Throws if the send cannot be completed offline or if funds are insufficient.
          */
         send(amount: number, proofs: Proof[], config?: SendConfig, outputConfig?: OutputConfig): Promise<SendResponse>;
         /**
          * Swap is an alias of send.
          */
         readonly swap: (amount: number, proofs: Proof[], config?: SendConfig, outputConfig?: OutputConfig) => Promise<SendResponse>;
         /**
          * Selects proofs to send based on amount and fee inclusion.
          *
          * @remarks
          * Uses an adapted Randomized Greedy with Local Improvement (RGLI) algorithm, which has a time
          * complexity O(n log n) and space complexity O(n).
          * @param proofs Array of Proof objects available to select from.
          * @param amountToSend The target amount to send.
          * @param includeFees Optional boolean to include fees; Default: false.
          * @param exactMatch Optional boolean to require exact match; Default: false.
          * @returns SendResponse containing proofs to keep and proofs to send.
          * @throws Throws an error if an exact match cannot be found within MAX_TIMEMS.
          * @see https://crypto.ethz.ch/publications/files/Przyda02.pdf
          */
         selectProofsToSend(proofs: Proof[], amountToSend: number, includeFees?: boolean, exactMatch?: boolean): SendResponse;
         /**
          * Prepares proofs for sending by signing P2PK-locked proofs.
          *
          * @remarks
          * Call this method before operations like send if the proofs are P2PK-locked and need unlocking.
          * This is a public wrapper for signing.
          * @param proofs The proofs to sign.
          * @param privkey The private key for signing.
          * @returns Signed proofs.
          */
         signP2PKProofs(proofs: Proof[], privkey: string | string[]): Proof[];
         /**
          * Calculates the fees based on inputs (proofs)
          *
          * @param proofs Input proofs to calculate fees for.
          * @returns Fee amount.
          * @throws Throws an error if the proofs keyset is unknown.
          */
         getFeesForProofs(proofs: Proof[]): number;
         /**
          * Returns the current fee PPK for a proof according to the cached keyset.
          *
          * @param proof {Proof} A single proof.
          * @returns FeePPK {number} The feePPK for the selected proof.
          * @throws Throws an error if the proofs keyset is unknown.
          */
         private getProofFeePPK;
         /**
          * Calculates the fees based on inputs for a given keyset.
          *
          * @param nInputs Number of inputs.
          * @param keysetId KeysetId used to lookup `input_fee_ppk`
          * @returns Fee amount.
          */
         getFeesForKeyset(nInputs: number, keysetId: string): number;
         /**
          * Prepares inputs for a mint operation.
          *
          * @remarks
          * Internal method; strips DLEQ for privacy and serializes witnesses.
          * @param proofs The proofs to prepare.
          * @param keepDleq Optional boolean to keep DLEQ (default: false, strips for privacy).
          * @returns Prepared proofs for mint payload.
          */
         private _prepareInputsForMint;
         /**
          * Decodes a string token.
          *
          * @remarks
          * Rehydrates a token from the space-saving CBOR format, including mapping short keyset ids to
          * their full representation.
          * @param token The token in string format (cashuB...)
          * @returns Token object.
          */
         decodeToken(token: string): Token;
         /**
          * Restores batches of deterministic proofs until no more signatures are returned from the mint.
          *
          * @param [gapLimit=300] The amount of empty counters that should be returned before restoring
          *   ends (defaults to 300). Default is `300`
          * @param [batchSize=100] The amount of proofs that should be restored at a time (defaults to
          *   100). Default is `100`
          * @param [counter=0] The counter that should be used as a starting point (defaults to 0). Default
          *   is `0`
          * @param [keysetId] Which keysetId to use for the restoration. If none is passed the instance's
          *   default one will be used.
          */
         batchRestore(gapLimit?: number, batchSize?: number, counter?: number, keysetId?: string): Promise<{
             proofs: Proof[];
             lastCounterWithSignature?: number;
         }>;
         /**
          * Regenerates.
          *
          * @param start Set starting point for count (first cycle for each keyset should usually be 0)
          * @param count Set number of blinded messages that should be generated.
          * @param options.keysetId Set a custom keysetId to restore from. @see `keyChain)`
          */
         restore(start: number, count: number, config?: RestoreConfig): Promise<{
             proofs: Proof[];
             lastCounterWithSignature?: number;
         }>;
         /**
          * @deprecated Use createMintQuoteBolt11()
          */
         createMintQuote(amount: number, description?: string): Promise<MintQuoteResponse>;
         /**
          * Requests a mint quote from the mint. Response returns a Lightning payment request for the
          * requested given amount and unit.
          *
          * @param amount Amount requesting for mint.
          * @param description Optional description for the mint quote.
          * @param pubkey Optional public key to lock the quote to.
          * @returns The mint will return a mint quote with a Lightning invoice for minting tokens of the
          *   specified amount and unit.
          */
         createMintQuoteBolt11(amount: number, description?: string): Promise<MintQuoteResponse>;
         /**
          * Requests a mint quote from the mint that is locked to a public key.
          *
          * @param amount Amount requesting for mint.
          * @param pubkey Public key to lock the quote to.
          * @param description Optional description for the mint quote.
          * @returns The mint will return a mint quote with a Lightning invoice for minting tokens of the
          *   specified amount and unit. The quote will be locked to the specified `pubkey`.
          */
         createLockedMintQuote(amount: number, pubkey: string, description?: string): Promise<LockedMintQuoteResponse>;
         /**
          * Requests a mint quote from the mint. Response returns a Lightning BOLT12 offer for the
          * requested given amount and unit.
          *
          * @param pubkey Public key to lock the quote to.
          * @param options.amount BOLT12 offer amount requesting for mint. If not specified, the offer will
          *   be amountless.
          * @param options.description Description for the mint quote.
          * @returns The mint will return a mint quote with a BOLT12 offer for minting tokens of the
          *   specified amount and unit.
          */
         createMintQuoteBolt12(pubkey: string, options?: {
             amount?: number;
             description?: string;
         }): Promise<Bolt12MintQuoteResponse>;
         /**
          * @deprecated Use checkMintQuoteBolt11()
          */
         checkMintQuote(quote: string | MintQuoteResponse): Promise<MintQuoteResponse | PartialMintQuoteResponse>;
         /**
          * Gets an existing mint quote from the mint.
          *
          * @param quote Quote ID.
          * @returns The mint will create and return a Lightning invoice for the specified amount.
          */
         checkMintQuoteBolt11(quote: string | MintQuoteResponse): Promise<MintQuoteResponse | PartialMintQuoteResponse>;
         /**
          * Gets an existing BOLT12 mint quote from the mint.
          *
          * @param quote Quote ID.
          * @returns The latest mint quote for the given quote ID.
          */
         checkMintQuoteBolt12(quote: string): Promise<Bolt12MintQuoteResponse>;
         /**
          * Generic method to mint proofs using any payment method.
          *
          * @remarks
          * This method enables support for custom payment methods. The method parameter is passed directly
          * to the internal _mintProofsGeneric function, enabling any endpoint of the form
          * `/v1/mint/{method}`.
          *
          * The payload factory function receives the blinded messages and should return the complete
          * payload object for the mint request. This allows custom payment methods to include additional
          * fields beyond the standard quote and outputs.
          * @example
          *
          * ```ts
          * // Standard bolt11 mint
          * const proofs = await wallet.mintProofsGeneric('bolt11', 100, (blindedMessages) => ({
          * 	quote: 'quote-id',
          * 	outputs: blindedMessages,
          * }));
          *
          * // Custom payment method with additional fields
          * const customProofs = await wallet.mintProofsGeneric(
          * 	'custom-payment',
          * 	100,
          * 	(blindedMessages) => ({
          * 		quote: customQuote.quote,
          * 		outputs: blindedMessages,
          * 		signature: signPayload(customQuote, blindedMessages),
          * 	}),
          * 	config,
          * );
          * ```
          *
          * @param method Payment method name (e.g., 'bolt11', 'bolt12', or custom method name).
          * @param amount Amount to mint.
          * @param payloadFactory Function that receives blinded messages and returns the mint payload.
          * @param config Optional configuration including keysetId and counter management.
          * @param outputType Configuration for proof generation. Defaults to wallet.defaultOutputType().
          * @returns Array of newly minted proofs.
          */
         mintProofsGeneric(method: string, amount: number, payloadFactory: (blindedMessages: SerializedBlindedMessage[]) => Record<string, unknown>, config?: MintProofsConfig, outputType?: OutputType): Promise<Proof[]>;
         /**
          * @deprecated Use mintProofsBolt11()
          */
         mintProofs(amount: number, quote: string | MintQuoteResponse, config?: MintProofsConfig, outputType?: OutputType): Promise<Proof[]>;
         /**
          * Mint proofs for a bolt11 quote.
          *
          * @param amount Amount to mint.
          * @param quote Mint quote ID or object (bolt11).
          * @param config Optional parameters (e.g. privkey for locked quotes).
          * @param outputType Configuration for proof generation. Defaults to wallet.defaultOutputType().
          * @returns Minted proofs.
          */
         mintProofsBolt11(amount: number, quote: string | MintQuoteResponse, config?: MintProofsConfig, outputType?: OutputType): Promise<Proof[]>;
         /**
          * Mints proofs for a bolt12 quote.
          *
          * @param amount Amount to mint.
          * @param quote Bolt12 mint quote.
          * @param privkey Private key to unlock the quote.
          * @param config Optional parameters (e.g. keysetId).
          * @param outputType Configuration for proof generation. Defaults to wallet.defaultOutputType().
          * @returns Minted proofs.
          */
         mintProofsBolt12(amount: number, quote: Bolt12MintQuoteResponse, privkey: string, config?: {
             keysetId?: string;
         }, outputType?: OutputType): Promise<Proof[]>;
         /**
          * Internal helper for minting proofs with bolt11 or bolt12.
          *
          * @remarks
          * Handles blinded messages, signatures, and proof construction. Use public methods like
          * mintProofs or helpers for API access.
          * @param method 'bolt11' or 'bolt12'.
          * @param amount Amount to mint (must be positive).
          * @param quote Quote ID or object.
          * @param config Optional (privkey, keysetId).
          * @param outputType Configuration for proof generation. Defaults to wallet.defaultOutputType().
          * @returns Minted proofs.
          * @throws If params are invalid or mint returns errors.
          */
         /**
          * Internal helper for minting proofs with any payment method.
          *
          * @remarks
          * This generic method now supports any payment method. The method parameter is passed directly to
          * the mint, enabling support for custom payment methods without code changes.
          * @param method Payment method name (e.g., 'bolt11', 'bolt12', or custom).
          * @param amount Amount to mint.
          * @param quote Quote ID (string) or quote response object. For string quotes, no signature is
          *   required.
          * @param config Optional configuration including private key for locked quotes.
          * @param outputType Configuration for proof generation.
          * @returns Array of newly minted proofs.
          * @throws If params are invalid or mint returns errors.
          */
         private _mintProofs;
         /**
          * Generic internal helper for minting proofs with any payment method.
          *
          * @remarks
          * This method enables support for custom payment methods. The method parameter is passed directly
          * to mint.mint(), allowing any endpoint of the form `/v1/mint/{method}`.
          * @param method Payment method name (e.g., 'bolt11', 'bolt12', or custom).
          * @param amount Amount to mint.
          * @param quote Quote ID (string) or quote response object.
          * @param config Optional configuration including private key for locked quotes.
          * @param outputType Configuration for proof generation.
          * @returns Array of newly minted proofs.
          */
         private _mintProofsGeneric;
         /**
          * Generic internal helper for minting proofs with a payload factory.
          *
          * @remarks
          * This method allows custom payment methods to provide their own payload creation logic.
          * @param method Payment method name (e.g., 'bolt11', 'bolt12', or custom).
          * @param amount Amount to mint.
          * @param payloadFactory Function that receives blinded messages and returns the mint payload.
          * @param config Optional configuration.
          * @param outputType Configuration for proof generation.
          * @returns Array of newly minted proofs.
          */
         private _mintProofsWithFactory;
         /**
          * @deprecated Use createMeltQuoteBolt11.
          */
         createMeltQuote(invoice: string): Promise<MeltQuoteResponse>;
         /**
          * Requests a melt quote from the mint. Response returns amount and fees for a given unit in order
          * to pay a Lightning invoice.
          *
          * @param invoice LN invoice that needs to get a fee estimate.
          * @returns The mint will create and return a melt quote for the invoice with an amount and fee
          *   reserve.
          */
         createMeltQuoteBolt11(invoice: string): Promise<MeltQuoteResponse>;
         /**
          * Requests a melt quote from the mint. Response returns amount and fees for a given unit in order
          * to pay a BOLT12 offer.
          *
          * @param offer BOLT12 offer that needs to get a fee estimate.
          * @param amountMsat Amount in millisatoshis for amount-less offers. If this is defined and the
          *   offer has an amount, they **MUST** be equal.
          * @returns The mint will create and return a melt quote for the offer with an amount and fee
          *   reserve.
          */
         createMeltQuoteBolt12(offer: string, amountMsat?: number): Promise<Bolt12MeltQuoteResponse>;
         /**
          * Requests a multi path melt quote from the mint.
          *
          * @remarks
          * Uses NUT-15 Partial multi-path payments for BOLT11.
          * @param invoice LN invoice that needs to get a fee estimate.
          * @param partialAmount The partial amount of the invoice's total to be paid by this instance.
          * @returns The mint will create and return a melt quote for the invoice with an amount and fee
          *   reserve.
          * @see https://github.com/cashubtc/nuts/blob/main/15.md
          */
         createMultiPathMeltQuote(invoice: string, millisatPartialAmount: number): Promise<MeltQuoteResponse>;
         /**
          * @deprecated Use checkMeltQuoteBolt11()
          */
         checkMeltQuote(quote: string | MeltQuoteResponse): Promise<MeltQuoteResponse | PartialMeltQuoteResponse>;
         /**
          * Returns an existing bolt11 melt quote from the mint.
          *
          * @param quote ID of the melt quote.
          * @returns The mint will return an existing melt quote.
          */
         checkMeltQuoteBolt11(quote: string | MeltQuoteResponse): Promise<MeltQuoteResponse | PartialMeltQuoteResponse>;
         /**
          * Returns an existing bolt12 melt quote from the mint.
          *
          * @param quote ID of the melt quote.
          * @returns The mint will return an existing melt quote.
          */
         checkMeltQuoteBolt12(quote: string): Promise<Bolt12MeltQuoteResponse>;
         /**
          * Generic method to create a mint quote for any payment method.
          *
          * @remarks
          * This method enables support for custom payment methods. The method parameter is passed directly
          * to the Mint class, enabling any endpoint of the form `/v1/mint/quote/{method}`.
          *
          * The payload factory function receives the wallet's unit and should return the complete payload
          * object for the mint quote request. This allows custom payment methods to include additional
          * fields beyond the standard amount and description.
          * @example
          *
          * ```ts
          * // Standard bolt11 mint quote
          * const quote = await wallet.createMintQuoteGeneric('bolt11', (unit) => ({
          * 	unit,
          * 	amount: 100,
          * 	description: 'My payment',
          * }));
          *
          * // Custom payment method with additional fields
          * const customQuote = await wallet.createMintQuoteGeneric('custom-payment', (unit) => ({
          * 	unit,
          * 	amount: 100,
          * 	customField: 'custom value',
          * }));
          * ```
          *
          * @param method Payment method name (e.g., 'bolt11', 'bolt12', or custom method name).
          * @param payloadFactory Function that receives the wallet unit and returns the mint quote
          *   payload.
          * @returns The mint will return a mint quote with payment details for the specified method.
          */
         createMintQuoteGeneric<T extends Record<string, unknown>>(method: string, payloadFactory: (unit: string) => Record<string, unknown>): Promise<T & {
             quote: string;
             amount: number;
             unit: string;
             expiry: number;
         }>;
         /**
          * Generic method to check a mint quote status for any payment method.
          *
          * @remarks
          * This method enables support for custom payment methods. The method parameter is passed directly
          * to the Mint class, enabling any endpoint of the form `/v1/mint/quote/{method}/{quote}`.
          * @example
          *
          * ```ts
          * const status = await wallet.checkMintQuoteGeneric('bolt11', 'quote-id');
          * const status = await wallet.checkMintQuoteGeneric('custom-payment', 'custom-quote-id');
          * ```
          *
          * @param method Payment method name (e.g., 'bolt11', 'bolt12', or custom method name).
          * @param quote Quote ID.
          * @returns The mint will return the current state of the mint quote.
          */
         checkMintQuoteGeneric<T extends Record<string, unknown>>(method: string, quote: string): Promise<T & {
             quote: string;
             amount: number;
             unit: string;
             expiry: number;
         }>;
         /**
          * Generic method to create a melt quote for any payment method.
          *
          * @remarks
          * This method enables support for custom payment methods. The method parameter is passed directly
          * to the Mint class, enabling any endpoint of the form `/v1/melt/quote/{method}`.
          *
          * The payload factory function receives the wallet's unit and should return the complete payload
          * object for the melt quote request. This allows custom payment methods to include additional
          * fields beyond the standard request.
          * @example
          *
          * ```ts
          * // Standard bolt11 melt quote
          * const quote = await wallet.createMeltQuoteGeneric('bolt11', (unit) => ({
          * 	unit,
          * 	request: 'lnbc...',
          * }));
          *
          * // Custom payment method with additional options
          * const customQuote = await wallet.createMeltQuoteGeneric('custom-payment', (unit) => ({
          * 	unit,
          * 	request: 'custom-request-string',
          * 	options: { foo: 'bar' },
          * }));
          * ```
          *
          * @param method Payment method name (e.g., 'bolt11', 'bolt12', or custom method name).
          * @param payloadFactory Function that receives the wallet unit and returns the melt quote
          *   payload.
          * @returns The mint will return a melt quote with fee and status information.
          */
         createMeltQuoteGeneric<T extends Record<string, unknown>>(method: string, payloadFactory: (unit: string) => Record<string, unknown>): Promise<T & {
             quote: string;
             amount: number;
             fee_reserve: number;
             state: string;
             expiry: number;
         }>;
         /**
          * Generic method to check a melt quote status for any payment method.
          *
          * @remarks
          * This method enables support for custom payment methods. The method parameter is passed directly
          * to the Mint class, enabling any endpoint of the form `/v1/melt/quote/{method}/{quote}`.
          * @example
          *
          * ```ts
          * const status = await wallet.checkMeltQuoteGeneric('bolt11', 'quote-id');
          * const status = await wallet.checkMeltQuoteGeneric('custom-payment', 'custom-quote-id');
          * ```
          *
          * @param method Payment method name (e.g., 'bolt11', 'bolt12', or custom method name).
          * @param quote Quote ID.
          * @returns The mint will return the current state of the melt quote.
          */
         checkMeltQuoteGeneric<T extends Record<string, unknown>>(method: string, quote: string): Promise<T & {
             quote: string;
             amount: number;
             fee_reserve: number;
             state: string;
             expiry: number;
         }>;
         /**
          * Generic method to melt proofs using any payment method.
          *
          * @remarks
          * This method enables support for custom payment methods. The method parameter is passed directly
          * to the internal _meltProofsWithFactory function, enabling any endpoint of the form
          * `/v1/melt/{method}`. ProofsToSend must be at least amount+fee_reserve. This function does not
          * perform coin selection!
          *
          * The payload factory function receives the proofs and change outputs, allowing custom payment
          * methods to construct their own payload structure.
          * @example
          *
          * ```ts
          * // Standard bolt11 melt
          * const response = await wallet.meltProofsGeneric(
          * 	'bolt11',
          * 	quote,
          * 	100, // amount
          * 	proofsToSend,
          * 	(proofs, outputs) => ({
          * 		quote: quote.quote,
          * 		inputs: proofs,
          * 		outputs,
          * 	}),
          * );
          *
          * // Custom payment method with additional fields
          * const customResponse = await wallet.meltProofsGeneric(
          * 	'custom-payment',
          * 	customQuote,
          * 	100,
          * 	proofsToSend,
          * 	(proofs, outputs) => ({
          * 		quote: customQuote.quote,
          * 		inputs: proofs,
          * 		outputs,
          * 		customField: 'custom value',
          * 	}),
          * );
          * ```
          *
          * @param method Payment method name (e.g., 'bolt11', 'bolt12', or custom method name).
          * @param meltQuote Quote response object containing quote ID, amount, and fee_reserve.
          * @param amount Total amount from the quote (amount + fee_reserve).
          * @param proofsToSend Proofs to melt (must be >= amount + fee_reserve).
          * @param payloadFactory Function that receives proofs and change outputs, returns melt payload.
          * @param config Optional configuration including callbacks.
          * @param outputType Configuration for change proof generation. Defaults to
          *   wallet.defaultOutputType().
          * @returns MeltProofsResponse with quote and change proofs.
          */
         meltProofsGeneric(method: string, meltQuote: Record<string, unknown> & {
             quote: string;
             amount: number;
             fee_reserve: number;
         }, amount: number, proofsToSend: Proof[], payloadFactory: (proofs: Proof[], outputs: SerializedBlindedMessage[]) => Record<string, unknown>, config?: MeltProofsConfig, outputType?: OutputType): Promise<MeltProofsResponse>;
         /**
          * @deprecated Use meltProofsBolt11()
          */
         meltProofs(meltQuote: MeltQuoteResponse, proofsToSend: Proof[], config?: MeltProofsConfig, outputType?: OutputType): Promise<MeltProofsResponse>;
         /**
          * Melt proofs for a bolt11 melt quote.
          *
          * @remarks
          * ProofsToSend must be at least amount+fee_reserve from the melt quote. This function does not
          * perform coin selection!.
          * @param meltQuote ID of the melt quote.
          * @param proofsToSend Proofs to melt.
          * @param config Optional parameters.
          * @param outputType Configuration for proof generation. Defaults to wallet.defaultOutputType().
          * @returns MeltProofsResponse with quote and change proofs.
          */
         meltProofsBolt11(meltQuote: MeltQuoteResponse, proofsToSend: Proof[], config?: MeltProofsConfig, outputType?: OutputType): Promise<MeltProofsResponse>;
         /**
          * Melt proofs for a bolt12 melt quote, returns change proofs using specified outputType.
          *
          * @remarks
          * ProofsToSend must be at least amount+fee_reserve from the melt quote. This function does not
          * perform coin selection!.
          * @param meltQuote ID of the melt quote.
          * @param proofsToSend Proofs to melt.
          * @param config Optional parameters.
          * @param outputType Configuration for proof generation. Defaults to wallet.defaultOutputType().
          * @returns MeltProofsResponse with quote and change proofs.
          */
         meltProofsBolt12(meltQuote: Bolt12MeltQuoteResponse, proofsToSend: Proof[], config?: MeltProofsConfig, outputType?: OutputType): Promise<MeltProofsResponse>;
         /**
          * Melt proofs for a given melt quote created with the bolt11 or bolt12 method.
          *
          * @remarks
          * Creates NUT-08 blanks (1-sat) for Lightning fee return. Get these by setting a
          * config.onChangeOutputsCreated callback for async melting. @see completeMelt.
          * @param method Payment method of the quote.
          * @param meltQuote The bolt11 or bolt12 melt quote.
          * @param proofsToSend Proofs to melt.
          * @param config Optional (keysetId, onChangeOutputsCreated).
          * @param outputType Configuration for proof generation. Defaults to wallet.defaultOutputType().
          * @returns MeltProofsResponse.
          * @throws If params are invalid or mint returns errors.
          * @see https://github.com/cashubtc/nuts/blob/main/08.md.
          */
         private _meltProofs;
         /**
          * Generic internal helper for melting proofs with any payment method.
          *
          * @remarks
          * This method enables support for custom payment methods. The method parameter is passed directly
          * to mint.melt(), allowing any endpoint of the form `/v1/melt/{method}`.
          * @param method Payment method name (e.g., 'bolt11', 'bolt12', or custom).
          * @param meltQuote Quote response object containing quote ID, amount, and fee_reserve.
          * @param proofsToSend Proofs to melt.
          * @param config Optional configuration including callbacks.
          * @param outputType Configuration for change proof generation.
          * @returns Melt response with quote and change proofs.
          */
         private _meltProofsGeneric;
         /**
          * Generic internal helper for melting proofs with a payload factory.
          *
          * @remarks
          * This method allows custom payment methods to provide their own payload creation logic.
          * @param method Payment method name (e.g., 'bolt11', 'bolt12', or custom).
          * @param meltQuote Quote response object containing quote ID, amount, and fee_reserve.
          * @param amount Total amount from the quote (amount + fee_reserve).
          * @param proofsToSend Proofs to melt.
          * @param payloadFactory Function that receives proofs and outputs, returns melt payload.
          * @param config Optional configuration including callbacks.
          * @param outputType Configuration for change proof generation.
          * @returns Melt response with quote and change proofs.
          */
         private _meltProofsWithFactory;
         /**
          * Completes a pending melt by re-calling the melt endpoint and constructing change proofs.
          *
          * @remarks
          * Use with blanks from onChangeOutputsCreated to retry pending melts. Works for Bolt11/Bolt12.
          * Returns change proofs if paid, else empty change.
          * @param blanks The blanks from onChangeOutputsCreated.
          * @returns Updated MeltProofsResponse.
          * @throws If melt fails or signatures don't match output count.
          */
         completeMelt<T extends MeltQuoteResponse>(blanks: MeltBlanks<T>): Promise<MeltProofsResponse>;
         /**
          * Get an array of the states of proofs from the mint (as an array of CheckStateEnum's)
          *
          * @param proofs (only the `secret` field is required)
          * @returns NUT-07 state for each proof, in same order.
          */
         checkProofsStates(proofs: Proof[]): Promise<ProofState[]>;
         /**
          * Groups proofs by their corresponding state, preserving order within each group.
          *
          * @param proofs (only the `secret` field is required)
          * @returns An object with arrays of proofs grouped by CheckStateEnum state.
          */
         groupProofsByState(proofs: Proof[]): Promise<{
             unspent: Proof[];
             pending: Proof[];
             spent: Proof[];
         }>;
     }

     /**
      * Developer friendly view of the wallet's deterministic output counters.
      */
     export declare class WalletCounters {
         private readonly src;
         constructor(src: CounterSource);
         /**
          * Returns the "next" counter for a specified keyset.
          */
         peekNext(keysetId: string): Promise<number>;
         /**
          * Bumps the counter if it is behind `minNext` (no-op if ahead).
          */
         advanceToAtLeast(keysetId: string, minNext: number): Promise<void>;
         /**
          * Hard-sets the cursor (useful for tests or migrations).
          *
          * @throws If the CounterSource does not support setNext()
          */
         setNext(keysetId: string, next: number): Promise<void>;
         /**
          * Returns the current "next" per keyset (what will be reserved next).
          *
          * @throws If the CounterSource does not support snapshot()
          */
         snapshot(): Promise<Record<string, number>>;
     }

     export declare class WalletEvents {
         private wallet;
         constructor(wallet: Wallet);
         private countersReservedHandlers;
         private meltBlanksHandlers;
         private withAbort;
         private waitUntilPaid;
         /**
          * Register a callback that fires whenever deterministic counters are reserved.
          *
          * Timing: the callback is invoked synchronously _after_ a successful reservation and _before_ the
          * enclosing wallet method returns. The wallet does **not** await your callback, it is
          * fire-and-forget.
          *
          * Responsibility for async work is on the consumer. If your handler calls an async function (e.g.
          * persisting `start + count` to storage), make sure to handle errors inside it to avoid unhandled
          * rejections.
          *
          * Typical use: persist `start + count` for the `keysetId` so counters survive restarts.
          *
          * @example
          *
          * ```ts
          * wallet.on.countersReserved(({ keysetId, start, count, next }) => {
          * 	saveNextToDb(keysetId, start + count); // handle async errors inside saveNextToDb
          * });
          * ```
          *
          * @param cb Handler called with { keysetId, start, count }.
          * @returns A function that unsubscribes the handler.
          */
         countersReserved(cb: (payload: OperationCounters) => void, opts?: SubscribeOpts): SubscriptionCanceller;
         /* Excluded from this release type: _emitCountersReserved */
         /**
          * Register a callback fired whenever NUT-08 blanks are created during a melt.
          *
          * Called synchronously right after blanks are prepared (before the melt request), and the wallet
          * does not await your handler.
          *
          * Typical use: persist `payload` so you can later call `wallet.completeMelt(payload)`.
          */
         meltBlanksCreated(cb: (payload: MeltBlanks) => void, opts?: SubscribeOpts): SubscriptionCanceller;
         /* Excluded from this release type: _emitMeltBlanksCreated */
         /**
          * Register a callback to be called whenever a mint quote's state changes.
          *
          * @param quoteIds List of mint quote IDs that should be subscribed to.
          * @param callback Callback function that will be called whenever a mint quote state changes.
          * @param errorCallback
          * @returns
          */
         mintQuoteUpdates(ids: string[], cb: (p: MintQuoteResponse) => void, err: (e: Error) => void, opts?: SubscribeOpts): Promise<SubscriptionCanceller>;
         /**
          * Register a callback to be called when a single mint quote gets paid.
          *
          * @param quoteId Mint quote id that should be subscribed to.
          * @param callback Callback function that will be called when this mint quote gets paid.
          * @param errorCallback
          * @returns
          */
         mintQuotePaid(id: string, cb: (p: MintQuoteResponse) => void, err: (e: Error) => void, opts?: SubscribeOpts): Promise<SubscriptionCanceller>;
         /**
          * Register a callback to be called whenever a melt quote’s state changes.
          *
          * @param quoteId Melt quote id that should be subscribed to.
          * @param callback Callback function that will be called when this melt quote gets paid.
          * @param errorCallback
          * @returns
          */
         meltQuoteUpdates(ids: string[], cb: (p: MeltQuoteResponse) => void, err: (e: Error) => void, opts?: SubscribeOpts): Promise<SubscriptionCanceller>;
         /**
          * Register a callback to be called when a single melt quote gets paid.
          *
          * @param quoteIds List of melt quote IDs that should be subscribed to.
          * @param callback Callback function that will be called whenever a melt quote state changes.
          * @param errorCallback
          * @returns
          */
         meltQuotePaid(id: string, cb: (p: MeltQuoteResponse) => void, err: (e: Error) => void, opts?: SubscribeOpts): Promise<SubscriptionCanceller>;
         /**
          * Register a callback to be called whenever a subscribed proof state changes.
          *
          * @param proofs List of proofs that should be subscribed to.
          * @param callback Callback function that will be called whenever a proof's state changes.
          * @param errorCallback
          * @returns
          */
         proofStateUpdates(proofs: Proof[], cb: (payload: ProofState & {
             proof: Proof;
         }) => void, err: (e: Error) => void, opts?: SubscribeOpts): Promise<SubscriptionCanceller>;
         /**
          * Resolve once a mint quote transitions to PAID, with automatic unsubscription, optional abort
          * signal, and optional timeout.
          *
          * The underlying subscription is always cancelled after resolution or rejection, including on
          * timeout or abort.
          *
          * @example
          *
          * ```ts
          * const ac = new AbortController();
          * // Cancel if the user navigates away
          * window.addEventListener('beforeunload', () => ac.abort(), { once: true });
          *
          * try {
          * 	const paid = await wallet.on.onceMintPaid(quoteId, {
          * 		signal: ac.signal,
          * 		timeoutMs: 60_000,
          * 	});
          * 	console.log('Mint paid, amount', paid.amount);
          * } catch (e) {
          * 	if ((e as Error).name === 'AbortError') {
          * 		console.log('User aborted');
          * 	} else {
          * 		console.error('Mint not paid', e);
          * 	}
          * }
          * ```
          *
          * @param id Mint quote id to watch.
          * @param opts Optional controls.
          * @param opts.signal AbortSignal to cancel the wait early.
          * @param opts.timeoutMs Milliseconds to wait before rejecting with a timeout error.
          * @returns A promise that resolves with the latest `MintQuoteResponse` once PAID.
          */
         onceMintPaid(id: string, opts?: {
             signal?: AbortSignal;
             timeoutMs?: number;
         }): Promise<MintQuoteResponse>;
         /**
          * Resolve when ANY of several mint quotes is PAID, cancelling the rest.
          *
          * Subscribes to all distinct ids, resolves with `{ id, quote }` for the first PAID, and cancels
          * all remaining subscriptions.
          *
          * Errors from individual subscriptions are ignored by default so a single noisy stream does not
          * abort the whole race. Set `failOnError: true` to reject on the first error instead. If all
          * subscriptions error and none paid, the promise rejects with the last seen error.
          *
          * @example
          *
          * ```ts
          * // Race multiple quotes obtained from splitting a large top up
          * const { id, quote } = await wallet.on.onceAnyMintPaid(batchQuoteIds, {
          * 	timeoutMs: 120_000,
          * });
          * console.log('First top up paid', id, quote.preimage?.length);
          * ```
          *
          * @param ids Array of mint quote ids (duplicates are ignored).
          * @param opts Optional controls.
          * @param opts.signal AbortSignal to cancel the wait early.
          * @param opts.timeoutMs Milliseconds to wait before rejecting with a timeout error.
          * @param opts.failOnError When true, reject on first error. Default false.
          * @returns A promise resolving to the id that won and its `MintQuoteResponse`.
          */
         onceAnyMintPaid(ids: string[], opts?: {
             signal?: AbortSignal;
             timeoutMs?: number;
             failOnError?: boolean;
         }): Promise<{
             id: string;
             quote: MintQuoteResponse;
         }>;
         /**
          * Resolve once a melt quote transitions to PAID, with automatic unsubscription, optional abort
          * signal, and optional timeout.
          *
          * Mirrors onceMintPaid, but for melts.
          *
          * @example
          *
          * ```ts
          * try {
          * 	const paid = await wallet.on.onceMeltPaid(meltId, { timeoutMs: 45_000 });
          * 	console.log('Invoice paid by mint, paid msat', paid.paid ?? 0);
          * } catch (e) {
          * 	console.error('Payment did not complete in time', e);
          * }
          * ```
          *
          * @param id Melt quote id to watch.
          * @param opts Optional controls.
          * @param opts.signal AbortSignal to cancel the wait early.
          * @param opts.timeoutMs Milliseconds to wait before rejecting with a timeout error.
          * @returns A promise that resolves with the `MeltQuoteResponse` once PAID.
          */
         onceMeltPaid(id: string, opts?: {
             signal?: AbortSignal;
             timeoutMs?: number;
         }): Promise<MeltQuoteResponse>;
         /**
          * Async iterable that yields proof state updates for the provided proofs.
          *
          * Adds a bounded buffer option:
          *
          * - If `maxBuffer` is set and the queue is full when a new payload arrives, either drop the oldest
          *   queued payload (`drop: 'oldest'`, default) or the incoming payload (`drop: 'newest'`). In
          *   both cases `onDrop` is invoked with the dropped payload.
          *
          * The stream ends and cleans up on abort or on the wallet error callback. Errors from the wallet
          * are treated as a graceful end for this iterator.
          *
          * @example
          *
          * ```ts
          * const ac = new AbortController();
          * try {
          * 	for await (const update of wallet.on.proofStatesStream(myProofs)) {
          * 		if (update.state === CheckStateEnum.SPENT) {
          * 			console.warn('Spent proof', update.proof.id);
          * 		}
          * 	}
          * } catch (e) {
          * 	if ((e as Error).name !== 'AbortError') {
          * 		console.error('Stream error', e);
          * 	}
          * }
          * ```
          *
          * @param proofs The proofs to subscribe to. Only `secret` is required.
          * @param opts Optional controls.
          * @param opts.signal AbortSignal that stops the stream when aborted.
          * @param opts.maxBuffer Maximum number of queued items before applying the drop strategy.
          * @param opts.drop Overflow strategy when `maxBuffer` is reached, 'oldest' | 'newest'. Default
          *   'oldest'.
          * @param opts.onDrop Callback invoked with the payload that was dropped.
          * @returns An async iterable of update payloads.
          */
         proofStatesStream<T = unknown>(proofs: Proof[], opts?: {
             signal?: AbortSignal;
             maxBuffer?: number;
             drop?: 'oldest' | 'newest';
             onDrop?: (payload: T) => void;
         }): AsyncIterable<T>;
         /**
          * Create a composite canceller that can collect many subscriptions and dispose them all in one
          * call.
          *
          * Accepts both a `SubscriptionCanceller` and a `Promise<SubscriptionCanceller>`. When the
          * composite canceller is called, all collected cancellations are invoked. Errors from individual
          * cancellers are caught and ignored.
          *
          * The returned function also has an `.add()` method to register more cancellers, and a
          * `.cancelled` boolean property for debugging.
          *
          * @example
          *
          * ```ts
          * const cancelAll = wallet.on.group();
          * cancelAll.add(wallet.on.mintQuotes(ids, onUpdate, onErr));
          * cancelAll.add(asyncSubscribeElsewhere());
          *
          * // later
          * cancelAll(); // disposes everything
          * ```
          *
          * @returns Composite canceller function with `.add()` and `.cancelled` members.
          */
         group(): SubscriptionCanceller & {
             add: (c: CancellerLike) => CancellerLike;
             cancelled: boolean;
         };
     }

     /**
      * Fluent operations builder for a Wallet instance.
      *
      * @remarks
      * Provides chainable builders for sending, receiving, and minting. Each builder is single use. If
      * you do not customise an output side, the wallet’s policy defaults apply.
      */
     export declare class WalletOps {
         private wallet;
         constructor(wallet: Wallet);
         send(amount: number, proofs: Proof[]): SendBuilder;
         receive(token: Token | string): ReceiveBuilder;
         /**
          * Generic method to mint proofs for any payment method.
          *
          * @remarks
          * This method enables support for custom payment methods using the fluent builder pattern. The
          * payload factory function receives the blinded messages and should return the complete mint
          * payload.
          * @example
          *
          * ```ts
          * const proofs = await wallet.ops
          * 	.mintGeneric('custom-payment', 100, (blindedMessages) => ({
          * 		quote: customQuote.quote,
          * 		outputs: blindedMessages,
          * 		customField: 'value',
          * 	}))
          * 	.asDeterministic()
          * 	.run();
          * ```
          *
          * @param method Payment method name (e.g., 'bolt11', 'bolt12', or custom method name).
          * @param amount Amount to mint.
          * @param payloadFactory Function that receives blinded messages and returns the mint payload.
          * @returns A MintBuilder for composing the mint operation.
          */
         mintGeneric(method: string, amount: number, payloadFactory: (blindedMessages: SerializedBlindedMessage[]) => Record<string, unknown>): MintBuilderGeneric;
         mintBolt11(amount: number, quote: string | MintQuoteResponse): MintBuilder<"bolt11", true>;
         mintBolt12(amount: number, quote: Bolt12MintQuoteResponse): MintBuilder<"bolt12", false>;
         /**
          * Generic method to melt proofs for any payment method.
          *
          * @remarks
          * This method enables support for custom payment methods using the fluent builder pattern. The
          * payload factory function receives the proofs and change outputs.
          * @example
          *
          * ```ts
          * const result = await wallet.ops
          * 	.meltGeneric(
          * 		'custom-payment',
          * 		customQuote,
          * 		customQuote.amount + customQuote.fee_reserve,
          * 		proofs,
          * 		(proofs, outputs) => ({
          * 			quote: customQuote.quote,
          * 			inputs: proofs,
          * 			outputs,
          * 		}),
          * 	)
          * 	.asDeterministic()
          * 	.run();
          * ```
          *
          * @param method Payment method name (e.g., 'bolt11', 'bolt12', or custom method name).
          * @param quote Quote response for the payment method.
          * @param amount Total amount from the quote (amount + fee_reserve).
          * @param proofs Proofs to melt.
          * @param payloadFactory Function that receives proofs and outputs, returns melt payload.
          * @returns A MeltBuilderGeneric for composing the melt operation.
          */
         meltGeneric(method: string, quote: Record<string, unknown> & {
             quote: string;
             amount: number;
             fee_reserve: number;
         }, amount: number, proofs: Proof[], payloadFactory: (proofs: Proof[], outputs: SerializedBlindedMessage[]) => Record<string, unknown>): MeltBuilderGeneric;
         meltBolt11(quote: MeltQuoteResponse, proofs: Proof[]): MeltBuilder;
         meltBolt12(quote: Bolt12MeltQuoteResponse, proofs: Proof[]): MeltBuilder;
     }

     /**
      * WebSocket supported methods.
      */
     export declare type WebSocketSupport = {
         method: string;
         unit: string;
         commands: string[];
     };

     export declare type WellKnownSecret = 'P2PK';

     export declare class WSConnection {
         readonly url: URL;
         private readonly _WS;
         private ws;
         private connectionPromise;
         private subListeners;
         private rpcListeners;
         private messageQueue;
         private handlingInterval?;
         private rpcId;
         private _logger;
         private onCloseCallbacks;
         constructor(url: string, logger?: Logger);
         connect(): Promise<void>;
         sendRequest(method: 'subscribe', params: JsonRpcReqParams): void;
         sendRequest(method: 'unsubscribe', params: {
             subId: string;
         }): void;
         /**
          * @deprecated Use cancelSubscription for JSONRPC compliance.
          */
         closeSubscription(subId: string): void;
         addSubListener<TPayload = unknown>(subId: string, callback: (payload: TPayload) => void): void;
         private addRpcListener;
         private removeRpcListener;
         private removeListener;
         ensureConnection(): Promise<void>;
         private handleNextMessage;
         createSubscription<TPayload = unknown>(params: Omit<JsonRpcReqParams, 'subId'>, callback: (payload: TPayload) => void, errorCallback: (e: Error) => void): string;
         /**
          * Cancels a subscription, sending an unsubscribe request and handling responses.
          *
          * @param subId The subscription ID to cancel.
          * @param callback The original payload callback to remove.
          * @param errorCallback Optional callback for unsubscribe errors (defaults to logging).
          */
         cancelSubscription<TPayload = unknown>(subId: string, callback: (payload: TPayload) => void, errorCallback?: (e: Error) => void): void;
         get activeSubscriptions(): string[];
         close(): void;
         onClose(callback: (e: CloseEvent) => void): void;
     }

     export { }
