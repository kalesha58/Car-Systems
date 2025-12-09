import { StyleSheet } from "react-native";

// Note: cartContainer background color should be set dynamically using theme
// This is a base style that can be overridden in components
export const hocStyles = StyleSheet.create({
    cartContainer:{
        position:'absolute',
        bottom:0,
        width:'100%',
        borderTopLeftRadius:10,
        borderTopRightRadius:10,
        elevation:10,
        shadowOffset:{width:1,height:1},
        shadowOpacity:0.3,
        shadowRadius:5
    }
})