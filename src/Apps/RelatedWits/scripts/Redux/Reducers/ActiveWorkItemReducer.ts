import { produce } from "immer";
import { ActiveWorkItemActions, ActiveWorkItemActionTypes } from "../Actions";
import { defaultActiveWorkItemState, IActiveWorkItemState } from "../Contracts";

export function activeWorkItemReducer(state: IActiveWorkItemState | undefined, action: ActiveWorkItemActions): IActiveWorkItemState {
    return produce(state || defaultActiveWorkItemState, draft => {
        switch (action.type) {
            case ActiveWorkItemActionTypes.SetActiveWorkItem: {
                const { id, rev, isNew, links, queryableFields, sortableFields, relationTypes, project, workItemTypeName } = action.payload;
                draft.id = id;
                draft.rev = rev;
                draft.isNew = isNew;
                draft.links = links;
                draft.queryableFields = queryableFields;
                draft.sortableFields = sortableFields;
                draft.relationTypes = relationTypes;
                draft.project = project;
                draft.workItemTypeName = workItemTypeName;
            }
        }
    });
}
