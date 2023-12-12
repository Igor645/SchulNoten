import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Image, Button, Text, View, FlatList, Alert, TextInput, Dimensions, KeyboardAvoidingView, Platform} from 'react-native';
import ImageButton from './listBtn';
import AddSubjectButton from './addSubjectBtn';
import Dropdown from './dropdown';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-chart-kit';
import DetailScreen from './detailsScreen';
import LoginScreen from './loginScreen';
import RegisterScreen from './registerScreen';
const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Overview" component={Overview}/>
        <Stack.Screen name="Details" component={DetailScreen} />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />
        <Stack.Screen name="Register" component={RegisterScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function Overview(){
  const isFocused = useIsFocused();
  const [semesters, setSemesters] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  let [currentStudentId, setCurrentStudentId] = useState(0);
  const [username, setUsername] = useState('');

  // Function to load semesters from local storage
  const loadSemesters = async () => {
    try {
      const storedSemesters = await AsyncStorage.getItem('semesters');
      if (storedSemesters !== null) {
        const parsedSemesters = JSON.parse(storedSemesters);
        console.log('Semesters JSON:', JSON.stringify(parsedSemesters, null, 2));
        setSemesters(parsedSemesters);
      } else {
        await AsyncStorage.setItem('semesters', JSON.stringify([]));
      }
    } catch (error) {
      console.error('Error loading semesters:', error);
    }
  };
  
  const checkLoginStatus = async () => {
    try {
      const userData = await AsyncStorage.getItem('loggedInUser');
      console.log(userData)
      if (userData !== null) {
        const parsedUserData = JSON.parse(userData);
        setIsLoggedIn(parsedUserData.isLoggedIn === true);
        setCurrentStudentId(parsedUserData.studentId);
        setUsername(parsedUserData.username);
        console.log(`Current studentId: ${currentStudentId}`)
        console.log(`Current username: ${username}`)
        console.log(`Current isloggedin: ${isLoggedIn}`)

      }
    } catch (error) {
      console.error('Error fetching login status:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await checkLoginStatus();
        await loadSemesters();
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    fetchData();
  }, [isFocused]);

  let clearAsyncStorage = async() => {
    AsyncStorage.clear();
  }

  
  const handleLogout = async () => {
    try {
      // Perform logout action - clear user data or perform any necessary actions
      // For example:
      await AsyncStorage.removeItem('loggedInUser');
      setIsLoggedIn(false);
      setCurrentStudentId(0);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const renderLoginButton = () => {
    if (isLoggedIn) {
      return (
        <Button
          title="Logout"
          onPress={handleLogout}
          style={styles.loginText}
        />
      );
    } else {
      return (
        <Button
          title="Login"
          onPress={() => navigation.navigate('Login')}
          style={styles.loginText}
        />
      );
    }
  };

  const renderUsername = () => {
    if (isLoggedIn) {
      return (
        <Text style={{}}>Welcome, {username}</Text>
      );
    } else {
      return null;
    }
  };

  // Function to save semesters to local storage
  const saveSemesters = async (data) => {
    try {
      await AsyncStorage.setItem('semesters', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving semesters:', error);
    }
  };


  const [selectedSemester, setSelectedSemester] = useState(null);
  const [newSubject, setNewSubject] = useState('');

  const handleDropdownChange = (semesterId) => {
    setSelectedSemester(semesterId);
  };

  const navigation = useNavigation();

  const handleDetail = (subject, grades) => {
    navigation.navigate('Details', {
      subject,
      grades,
      semesterId: selectedSemester, // Pass the semesterId
      studentId: currentStudentId,    // Pass the studentId
    });  };

  const handleAddSubject = () => {
    if (newSubject.trim() === '') {
      Alert.alert('Please enter a subject name');
      return;
    }

    console.log(`This was selected ${selectedSemester}`);
  
    const foundSemesterIndex = semesters.findIndex(
      (semester) => semester.studentId === currentStudentId && semester.id === selectedSemester
    );
  
    if (foundSemesterIndex !== -1) {
      const currentSemester = { ...semesters[foundSemesterIndex] };
  
      if (currentSemester.grades.hasOwnProperty(newSubject)) {
        Alert.alert('Subject already exists!');
      } else {
        currentSemester.grades = { ...currentSemester.grades, [newSubject]: [] };
        const updatedSemesters = [...semesters];
        updatedSemesters[foundSemesterIndex] = currentSemester;
  
        setSemesters(updatedSemesters);
        setNewSubject('');
        saveSemesters(updatedSemesters);
      }
    } else {
      const newSemester = {
        id: selectedSemester,
        studentId: currentStudentId,
        grades: { [newSubject]: [] }
      };

      const updatedSemesters = [...semesters, newSemester];
      setSemesters(updatedSemesters);
      setNewSubject('');
      saveSemesters(updatedSemesters);
    }    
  };

  const calculateAverage = (semester, subject) => {
    if (semester.grades.hasOwnProperty(subject)) {
      const grades = semester.grades[subject].map(parseFloat); // Convert grades to numbers
      if (grades.length > 0) {
        const sumOfGrades = grades.reduce((sum, grade) => sum + grade, 0);
        const averageGrade = sumOfGrades / grades.length;
        return averageGrade.toFixed(2);
      }
    }
    return '--'; // Default value if no grades exist
  };
  
  const handleDeleteSubject = (semesterId, subject) => {
    const updatedSemesters = semesters.map((semester) => {
      if (semester.id === semesterId) {
        const updatedGrades = { ...semester.grades };
        delete updatedGrades[subject];
        return { ...semester, grades: updatedGrades };
      }
      return semester;
    });
  
    setSemesters(updatedSemesters);
    saveSemesters(updatedSemesters);
  };
  
  const goToLoginScreen = () => {
    navigation.navigate('Login');
  };

  const renderItem = ({ item, semesterId, studentId }) => {
    if (item.id === semesterId && item.studentId === studentId) {
      const subjectGrades = Object.entries(item.grades);
  
      return subjectGrades.map(([subject, grades], index) => {
        let averageGrade = calculateAverage(item, subject);
  
        return (
          <View
            style={[
              styles.row,
              { backgroundColor: index % 2 === 0 ? '#caf0f8' : '#90e0ef' },
            ]}
            key={`${subject}_${index}`}
          >
            <View style={styles.rowItem}>
              <Text>{subject}</Text>
            </View>
            <View style={styles.rowItem}>
              <Text>{averageGrade}</Text>
            </View>
            <View style={styles.rowItem}>
              <ImageButton onPress={() => handleDetail(subject, grades)} />
              <TouchableOpacity onPress={() => handleDeleteSubject(item.id, subject)}>
                <Image source={require('./images/trash.png')} style={styles.deleteButton} />
              </TouchableOpacity>
            </View>
          </View>
        );
      });
    } else {
      return null;
    }
  };
  

  return (
    <KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={{ flex: 1 }}
>
<ScrollView style={{ flex: 1 }}>

    <View style={styles.container}>
      <StatusBar style="auto" />
      <View style={isLoggedIn ? styles.loginRelated : { ...styles.loginRelated, justifyContent: "flex-end", marginRight: 10 }}>
      {renderUsername()}
      {renderLoginButton()} 
      </View>
      {isLoggedIn ? (
        <Dropdown onSelect={handleDropdownChange} semesters={semesters}/>
      ) : (null)}      

        <View style={styles.subjectContainer}>
  
        <View>
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Text style={styles.tableTitle}>Subject</Text>
            </View>
            <View style={styles.rowItem}>
              <Text style={styles.tableTitle}>Average Grade</Text>
            </View>
            <View style={styles.rowItem}>
              <Text style={styles.tableTitle}>Details</Text>
            </View>
          </View>
  
          {semesters.map((item, index) => (
            renderItem({
              item,
              index,
              semesterId: selectedSemester,
              studentId: currentStudentId,
            })
          ))}
  
        </View>
  
        <View style={styles.addButtonContainer}  disabled={!isLoggedIn}>
          <TextInput
            style={{ textAlign: 'center', marginBottom: 5,
              borderBottomWidth: 1,
              borderBottomColor: '#e3e4ef',
              backgroundColor: '#f0f0f5',
              paddingLeft: 25,
              paddingRight: 25,
              marginTop: 25,
            }}
            placeholder="Enter subject name"
            value={newSubject}
            onChangeText={(text) => setNewSubject(text)}
            editable={isLoggedIn}
            />
          <AddSubjectButton onPress={isLoggedIn ? handleAddSubject : goToLoginScreen} />
        </View>
  
      </View>
      <Button onPress={clearAsyncStorage} title="Clear Async Storage" disabled={!isLoggedIn}>
      </Button>
    </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: Dimensions.get('window').height * 0.92,
    backgroundColor: '#e3e4ef',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    width: "100%",
  },
  subjectContainer:{
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
    backgroundColor: "white",
    width: "80%",
    minHeight: "70%",
    borderWidth: 10,
    borderColor: 'white',
    borderStyle: 'solid',
    },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#00b4d8',
    width: "100%",
  },
  rowItem: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    justifyContent: "space-evenly",
  },
  tableTitle:{
    fontWeight: "bold", 
    textAlign: "center",
  },
  addButtonContainer: {
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  gradeItem: {
    flex: 1,
  },
  deleteButton: {
    width: 25,
    height: 25,
    resizeMode: 'contain',
    tintColor: 'red', // Add a tint color or customize as needed
  },
  subjectTitle: {
    fontSize: 20, // Adjust the size as needed
    textAlign: 'center',
    marginBottom: 10,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginRight: 30,
  },
  loginText:{
    backgroundColor: "blue",
    color: "white",
  },
  loginRelated:{
    flexDirection: "row",
    width: "50%",
    marginLeft: "auto",
    justifyContent: "space-evenly",
    alignItems: "center",
  },
});

