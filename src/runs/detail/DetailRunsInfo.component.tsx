import {RunResource} from "../../common/resources/Run.resource";
import {StyleSheet, Text} from "react-native";
import React, {Fragment} from "react";
import {CardComponentWithIcon} from "../../common/component/Card.component";
import {InlineTextComponent} from "../../common/component/text/InlineText.component";
import {ImportantTextComponent} from "../../common/component/text/ImportantText.component";
import {Colors} from "../../common/utils/Color.utils";
import { participates } from "../../common/utils/Run.utils";
import { AuthContainer } from "../../Provider.component";
import { DetailRunsContactBtn } from "./DetailRunsContactBtn.component";


export interface InfoDetailRunsComponentProps {
    currentRun: RunResource
}

export function DetailRunsInfoComponent({currentRun}: InfoDetailRunsComponentProps) {

    const {authenticatedUser} = AuthContainer.useContainer()

    return (
        <CardComponentWithIcon title={"Informations"} icon={"info-circle"}>
            <InlineTextComponent>
                <Text style={styles.textRegular}>Nombre de passager : </Text>
                <ImportantTextComponent>{currentRun.nb_passenger}</ImportantTextComponent>
            </InlineTextComponent>

            <Text style={styles.textInfo}>{currentRun.runinfo}</Text>

            {currentRun.name_contact ? (
                <InlineTextComponent>
                    <Text style={styles.textRegular}>Contact : </Text>
                    <Text style={styles.textContact}>{currentRun.name_contact} {currentRun.num_contact}</Text>
                </InlineTextComponent>
            ) : <Fragment/>}
            {currentRun.name_contact && participates(currentRun, authenticatedUser)? (
                <DetailRunsContactBtn currentRun={currentRun}/>
            ) : <Fragment/>}


        </CardComponentWithIcon>
    )
}

const styles = StyleSheet.create({
    textContact: {
        fontFamily: 'Montserrat-Regular',
    },

    textInfo: {
        fontFamily: 'Montserrat-Regular',
        marginTop: 10,
        marginBottom: 10
    },

    textRegular: {
        color: Colors.GREY,
        fontFamily: 'Montserrat-Regular',
    },
});
