import { ILongText } from "BugBashPro/Shared/Contracts";
import { LoadStatus } from "Common/Contracts";
import { ActionsOfType } from "Common/Redux";
import { SagaIterator } from "redux-saga";
import { call, put, select, takeEvery } from "redux-saga/effects";
import { BugBashDetailActions, BugBashDetailActionTypes } from "./Actions";
import { addOrUpdateDetailsAsync, fetchBugBashDetailsAsync } from "./DataSource";
import { getBugBashDetailsStatus } from "./Selectors";

export function* bugBashDetailsSaga(): SagaIterator {
    yield takeEvery(BugBashDetailActionTypes.BugBashDetailsLoadRequested, loadBugBashDetails);
    yield takeEvery(BugBashDetailActionTypes.BugBashDetailsUpdateRequested, updateBugBashDetails);
}

function* loadBugBashDetails(action: ActionsOfType<BugBashDetailActions, BugBashDetailActionTypes.BugBashDetailsLoadRequested>): SagaIterator {
    const bugBashId = action.payload;
    const status: LoadStatus = yield select(getBugBashDetailsStatus, bugBashId);

    if (status !== LoadStatus.Loading && status !== LoadStatus.Updating) {
        yield put(BugBashDetailActions.beginLoadBugBashDetails(bugBashId));
        const details: ILongText = yield call(fetchBugBashDetailsAsync, bugBashId);
        yield put(BugBashDetailActions.bugBashDetailsLoaded(bugBashId, details));
    }
}

function* updateBugBashDetails(action: ActionsOfType<BugBashDetailActions, BugBashDetailActionTypes.BugBashDetailsUpdateRequested>): SagaIterator {
    const { bugBashDetails, bugBashId } = action.payload;
    const status: LoadStatus = yield select(getBugBashDetailsStatus, bugBashId);

    if (status === LoadStatus.Ready || status === LoadStatus.UpdateFailed) {
        yield put(BugBashDetailActions.beginUpdateBugBashDetails(bugBashId, bugBashDetails));

        try {
            const updatedDetails: ILongText = yield call(addOrUpdateDetailsAsync, bugBashDetails);
            yield put(BugBashDetailActions.BugBashDetailsUpdated(bugBashId, updatedDetails));
        } catch (e) {
            yield put(BugBashDetailActions.BugBashDetailsUpdateFailed(bugBashId, bugBashDetails, e.message));
        }
    }
}
