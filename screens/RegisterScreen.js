import React, {useContext, useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {User, Lock, Image, AtSign} from 'react-native-feather';
import RegistrationSVG from '../assets/images/register.svg';
import * as ImagePicker from 'react-native-image-picker';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';

import InputField from '../components/InputField';
import CustomButton from '../components/CustomButton';
import {UserRegistering} from '../components/AppContext';

import {generateKeyPair} from '../utils/crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../assets/colors/colors';

export default RegisterScreen = ({navigation}) => {
  const {setUserRegistering, userRegistering} = useContext(UserRegistering);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [image, setImage] = useState(null);
  let dUrl = '';

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibrary();

    if (!result.didCancel) {
      setImage(result.assets[0].uri);
    }
  };

  const signUpWithEmailAndPassword = async () => {
    await auth().createUserWithEmailAndPassword(
      email,
      password,
    );
  };

  const uploadImage = async () => {
    const uid = auth().currentUser.uid;
    const childPath = `data/users/` + uid + `/profilePic`;
    let response;

    if (image) {
      response = await fetch(image);
    } else {
      response = await fetch(
        'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png',
      );
    }
    const blob = await response.blob();
    const snapshot = await storage().ref().child(childPath).put(blob);
    dUrl = await storage().ref(snapshot.metadata.fullPath).getDownloadURL();
  };

  const createFirestoreUser = async () => {
    // generate private and public keys and save it to local storage
    const publicKey = await createKeyPair();
    // Create user in firestore
    await firestore().collection('users').doc(auth().currentUser.uid).set({
      fullName: fullName,
      email: email,
      photoURL: dUrl,
      uid: auth().currentUser.uid,
      publicKey: publicKey,
    });

    setUserRegistering(false);
  };

  const createKeyPair = async () => {
    // generate private/public key
    const {publicKey, secretKey} = generateKeyPair();

    // save private key to Async storage
    await AsyncStorage.setItem(auth().currentUser.uid, secretKey.toString());

    return publicKey.toString();
  };

  const signUp = async () => {
    if (password === confirmPassword) {
      try {
        // Do not hang while registering user
        setUserRegistering(true);

        // Create authentication user
        await signUpWithEmailAndPassword();

        // Upload profile pic to firebase storage
        await uploadImage();

        // create firestore record for created user
        await createFirestoreUser();
      } catch (error) {
        setUserRegistering(false);
        Alert.alert('Registration error', error)
      }
    }
  };

  if (userRegistering)
    return (
      <SafeAreaView style={{flex: 1, justifyContent: 'center'}}>
        <ActivityIndicator size={'large'} />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={{flex: 1, justifyContent: 'center'}}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{paddingHorizontal: 25}}>
        <View style={{alignItems: 'center'}}>
          <RegistrationSVG
            height={230}
            width={230}
            // style={{transform: [{rotate: '-5deg'}]}}
          />

          <Text
            style={{
              fontSize: 40,
              fontFamily: 'Outfit-Bold',
              color: colors.fontColor,
              marginBottom: 40,
              paddingTop: 30,
              textAlign: 'center',
            }}>
            Register
          </Text>
          <InputField
            label={'Email'}
            autoCapitalize={'none'}
            icon={
              <AtSign
                size={20}
                color={colors.textInputMessage}
                style={{marginRight: 5}}
              />
            }
            textChangedFunction={setEmail}
            inputType="email"
          />
          <InputField
            label={'Full name'}
            autoCapitalize={'none'}
            icon={
              <User
                size={20}
                color={colors.textInputMessage}
                style={{marginRight: 5}}
              />
            }
            textChangedFunction={setFullName}
          />
          <InputField
            label={'Password'}
            icon={
              <Lock
                size={20}
                color={colors.textInputMessage}
                style={{marginRight: 5}}
              />
            }
            inputType="password"
            textChangedFunction={setPassword}
          />
          <InputField
            label={'Confirm password'}
            icon={
              <Lock
                size={20}
                color={colors.textInputMessage}
                style={{marginRight: 5}}
              />
            }
            inputType="password"
            textChangedFunction={setConfirmPassword}
          />
          <View
            style={{
              flexDirection: 'row',
              borderBottomColor: '#ccc',
              borderBottomWidth: 1,
              paddingBottom: 8,
              marginBottom: 30,
            }}>
            <Image
              name="calendar-outline"
              size={20}
              color={colors.textInputMessage}
              style={{marginRight: 5}}
            />
            <TouchableOpacity onPress={pickImage}>
              <Text
                style={{
                  color: colors.textInputMessage,
                  marginLeft: 5,
                  marginTop: 5,
                  fontFamily: 'Outfit-Regular',
                }}>
                Pick Profile Photo
              </Text>
            </TouchableOpacity>
          </View>
          <CustomButton label={'Register'} onPress={signUp} />

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              marginBottom: 30,
            }}>
            <Text
              style={{
                color: colors.textInputMessage,
                fontFamily: 'Outfit-Regular',
              }}>
              Already registered?
            </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={{color: colors.primary, fontFamily: 'Outfit-Bold'}}>
                {' '}
                Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
