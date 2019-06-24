import * as SDK from "azure-devops-extension-sdk";

let identityService: IVssIdentityService;

/**
 * Contribution ids of identity services which can be obtained from DevOps.getService
 */
export const enum IdentityServiceIds {
    /**
     * Provides a way to search for identities.
     */
    IdentityService = "ms.vss-features.identity-service"
}

export interface IIdentity {
    entityId: string;
    entityType: string;
    originDirectory: string;
    originId: string;
}

export interface IdentitiesGetConnectionsResponseModel {
    successors?: IIdentity[];
    managers?: IIdentity[];
    directReports?: IIdentity[];
}

export interface IdentitiesSearchRequestModel {
    query: string;
    identityTypes?: string[];
    operationScopes?: string[];
    queryTypeHint?: string;
    pagingToken?: string;
    properties?: string[];
    filterByAncestorEntityIds?: string[];
    filterByEntityIds?: string[];
    options?: any;
}

export interface IVssIdentityService {
    /**
     * Get a list of the Most Recently Used (MRU) identities
     *
     * @returns list of the Most Recently Used (MRU) identities
     */
    getIdentityMruAsync(): Promise<IIdentity[]>;

    /**
     * Given a search request model, return a list of Entities. If the filterIdentity callback is added, additionally filter the values before returning
     *
     * @param query The query to search the identities type with.
     * @param identityTypes The types of identities to search (default "user" and "group")
     * @param operationScopes The scope you would like to search (default "ims", "source")
     * @param queryTypeHint A hint of what property your query is trying to search
     * @param filterIdentity A filter passed in to alter the results of the identities found
     * @param options Additional options to pass into the search
     * @returns The list of filtered identities from the search.
     */
    searchIdentitiesAsync(
        query: string,
        identityTypes?: string[],
        operationScopes?: string[],
        queryTypeHint?: string,
        options?: any,
        filterIdentity?: (returnedEntities: IIdentity[]) => IIdentity[]
    ): Promise<IIdentity[]>;

    /**
     * Add a list of identities to the MRU
     *
     * @param identities list of IdentityRefs to add to the MRU
     * @returns True if the item was added, false otherwise
     */
    addMruIdentitiesAsync(identities: IIdentity[]): Promise<boolean>;

    /**
     * Remove a list of identities from the MRU
     *
     * @param identities list of IdentityRefs to remove from the MRU
     * @returns True if the item was removed, false otherwise
     */
    removeMruIdentitiesAsync(identity: IIdentity[]): Promise<boolean>;

    /**
     * Gets a list of connections for a given identity
     *
     * @param identity Entity to look up connections
     * @returns Connections for the given identity
     */
    getConnections(identity: IIdentity, getDirectReports?: boolean): Promise<IdentitiesGetConnectionsResponseModel>;
}

export interface IPeoplePickerProvider {
    /**
     * Add identities to the MRU
     * @returns A promise that returns true if successful false otherwise
     */
    addIdentitiesToMRU?: (identities: IIdentity[]) => Promise<boolean>;

    /**
     * Request Entity information given an entityId
     */
    getEntityFromUniqueAttribute: (entityId: string) => IIdentity | PromiseLike<IIdentity>;

    /**
     * If no input is in the search box when clicked, provide a set of identities to show (used for MRU)
     */
    onEmptyInputFocus?: () => IIdentity[] | PromiseLike<IIdentity[]> | null;

    /**
     * Given a list of currently selected items and a filter string, return a list of suggestions to put in the suggestion list
     */
    onFilterIdentities: (filter: string, selectedItems?: IIdentity[]) => IIdentity[] | PromiseLike<IIdentity[]> | null;

    /**
     * Request connection information about a given Entity.
     */
    onRequestConnectionInformation: (
        entity: IIdentity,
        getDirectReports?: boolean
    ) => IdentitiesGetConnectionsResponseModel | PromiseLike<IdentitiesGetConnectionsResponseModel>;

    /**
     * Remove identities from the MRU
     * @returns A promise that returns true if successful false otherwise
     */
    removeIdentitiesFromMRU?: (identities: IIdentity[]) => Promise<boolean>;
}

export async function getIdentityService(): Promise<IVssIdentityService> {
    if (!identityService) {
        identityService = await SDK.getService<IVssIdentityService>(IdentityServiceIds.IdentityService);
    }

    return identityService;
}

export class PeoplePickerProvider implements IPeoplePickerProvider {
    private identityService: Promise<IVssIdentityService>;

    constructor() {
        this.identityService = getIdentityService();
    }

    public addIdentitiesToMRU = (identities: IIdentity[]): Promise<boolean> => {
        return this.identityService.then(identityService => {
            return identityService.addMruIdentitiesAsync(identities);
        });
    };

    public getEntityFromUniqueAttribute = (entityId: string): IIdentity | PromiseLike<IIdentity> => {
        return this.identityService.then(identityService => {
            return identityService.searchIdentitiesAsync(entityId, ["user"], ["ims", "source"], "uid").then(x => x[0]);
        });
    };

    public onEmptyInputFocus = (): IIdentity[] | PromiseLike<IIdentity[]> => {
        return this.identityService.then(identityService => {
            return identityService.getIdentityMruAsync().then(identities => {
                return identities;
            });
        });
    };

    public onFilterIdentities = (filter: string, selectedItems?: IIdentity[]): Promise<IIdentity[]> | IIdentity[] => {
        return this._onSearchPersona(filter, selectedItems ? selectedItems : []);
    };

    public onRequestConnectionInformation = (
        entity: IIdentity,
        getDirectReports?: boolean
    ): IdentitiesGetConnectionsResponseModel | PromiseLike<IdentitiesGetConnectionsResponseModel> => {
        return this.identityService.then(identityService => {
            return identityService.getConnections(entity, getDirectReports);
        });
    };

    public removeIdentitiesFromMRU = (identities: IIdentity[]): Promise<boolean> => {
        return this.identityService.then(identityService => {
            return identityService.removeMruIdentitiesAsync(identities);
        });
    };

    private _onSearchPersona = (searchText: string, items: IIdentity[]): Promise<IIdentity[]> => {
        const searchRequest: IdentitiesSearchRequestModel = { query: searchText };
        return this.identityService.then(identityService => {
            return identityService
                .searchIdentitiesAsync(
                    searchRequest.query,
                    searchRequest.identityTypes,
                    searchRequest.operationScopes,
                    searchRequest.queryTypeHint,
                    searchRequest.options
                )
                .then((identities: IIdentity[]) => {
                    return identities.filter(identity => !items.some(selectedIdentity => selectedIdentity.entityId === identity.entityId));
                });
        });
    };
}
