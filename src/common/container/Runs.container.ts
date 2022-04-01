import {RunResource} from "../resources/Run.resource";
import {List} from "immutable";
import Axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {DateTime} from "luxon";
import {useCacheHelper} from "../utils/CacheHelper.utils";
import {DataContainerInterface} from "./DataContainer.interface";
import {RunnerResource} from "../resources/Runner.resource";
import { setStatusBarNetworkActivityIndicatorVisible } from "expo-status-bar";

export interface RunsContainer extends DataContainerInterface<RunResource> {
    updateVehicle: (runnerId: number, carId: number) => Promise<void>,
    startRun: (run: RunResource) => Promise<void>,
    stopRun: (run: RunResource, gasLevel: number) => Promise<void>,
    takeRun: (run: RunResource, runner: RunnerResource) => Promise<void>,
    acknowledgeRun: (run: RunResource) => Promise<void>,
    saveInMyRunsList: (run: RunResource) => Promise<void>
}

export function useRunsContainer(): RunsContainer {
    const cacheHelper = useCacheHelper<RunResource>("RUN", parseRunResource);

    const refresh = (): Promise<void> => {
        const mostRecentlyChangedRun = cacheHelper.items
            .sortBy(run => run.updated_at)
            .last<RunResource | undefined>();
    
        return getRunsFromApi(mostRecentlyChangedRun?.updated_at)
            .then(fetchedRuns => cacheHelper.insertItems(List(fetchedRuns))).catch(error => error.text);
    }

    const updateVehicle = (runnerId: number, carId: number): Promise<void> =>
        updateRunnerCarApi(runnerId, carId).then(cacheHelper.insertItem).catch(error => error.text);

    const startRun = (run: RunResource): Promise<void> =>
        startRunApi(run).then(cacheHelper.insertItem).catch(error => error.text);

    const stopRun = (run: RunResource, gasLevel: number): Promise<void> =>
        stopRunApi(run, gasLevel).then(cacheHelper.insertItem).catch(error => error.text);

    const takeRun = (run: RunResource, runner: RunnerResource) =>
        takeRunApi(run, runner).then(cacheHelper.insertItem).catch(error => error.text);

    const acknowledgeRun = (run: RunResource): Promise<void> =>
        acknowledgeRunApi(run).then(cacheHelper.insertItem).catch(error => error.text);

    return {
        items: cacheHelper.items,
        readFromCache: cacheHelper.readFromCache,
        refresh,
        updateVehicle,
        startRun,
        stopRun,
        takeRun,
        acknowledgeRun,
        saveInMyRunsList,
        empty: cacheHelper.empty
    }
}

function takeRunApi(run: RunResource, runner: RunnerResource): Promise<RunResource> {
    return Axios.patch(`/runners/${runner.id}/driver`, {
        updated_at: run.updated_at.toString()
    }).then(res => parseRunResource(res.data)).catch(error => error.text);
}

function startRunApi(run: RunResource): Promise<RunResource> {
    return Axios.patch(`/runs/${run.id}/start`)
        .then(res => parseRunResource(res.data)).catch(error => error.text);
}

function stopRunApi(run: RunResource, gasLevel: number): Promise<RunResource> {
    return Axios.patch(`/runs/${run.id}/stop`, {
        gas_level: gasLevel
    }).then(res => parseRunResource(res.data)).catch(error => error.text);
}

function updateRunnerCarApi(runnerId: number, carId: number): Promise<RunResource> {
    return Axios.patch(`/runners/${runnerId}/car`, {
        car_id: carId
    }).then(res => parseRunResource(res.data)).catch(error => error.text);
}

function getRunsFromApi(onlyFromTime?: DateTime): Promise<RunResource[]> {
    const params: any = {};

    if (onlyFromTime) {
        params.onlyFromTime = onlyFromTime.toString()
    }

    return Axios.get("/runs", {params}).then(res => res.data.map(parseRunResource)).catch(error => error.text);
}


function acknowledgeRunApi(run: RunResource): Promise<RunResource> {
    saveInMyRunsList(run);
    return Axios.patch(`/runs/${run.id}/acknowledge`).then(res => parseRunResource(res.data)).catch(error => error.text);
}

function parseRunResource(runFromApi: any): RunResource {
    return {
        ...runFromApi,
        begin_at: DateTime.fromISO(runFromApi.begin_at),
        end_at: DateTime.fromISO(runFromApi.end_at),
        finished_at: DateTime.fromISO(runFromApi.finished_at),
        start_at: DateTime.fromISO(runFromApi.start_at),
        updated_at: DateTime.fromISO(runFromApi.updated_at),
        acknowledged_at: DateTime.fromISO(runFromApi.acknowledged_at),
        waypoints: List(runFromApi.waypoints),
        runners: List(runFromApi.runners)
    }
}

async function saveInMyRunsList(run: RunResource): Promise<void>{
    const myRuns = await AsyncStorage.getItem('myRuns');
    console.log(run.id);
    if (myRuns != null) {
        console.log("ajout du run dans mes runs");
        const parsedList = JSON.parse(myRuns);
        
        //pop the run if it is already in the list
        const index = parsedList.findIndex((r: RunResource) => r.id === run.id);
        if (index !== -1) {
            parsedList.splice(index, 1);
        }

        parsedList.forEach((r: RunResource) => {
            console.log(r.id);
        });

        parsedList.push(run);
        await AsyncStorage.removeItem('myRuns');
        await AsyncStorage.setItem('myRuns', JSON.stringify(parsedList));
        

    }else{
        console.log("ajout premier");
        return await AsyncStorage.setItem('myRuns', JSON.stringify([run]));
    }
};