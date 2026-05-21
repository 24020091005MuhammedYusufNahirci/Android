import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  Alert,
  StatusBar
} from 'react-native';
import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase(
  {
    name: 'TodosDB',
    location: 'default',
  },
  () => console.log('Veritabanı başarıyla açıldı.'),
  error => console.log('Veritabanı hatası: ', error)
);

export default function App() {
  const [todoText, setTodoText] = useState('');
  const [todos, setTodos] = useState([]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    createTable();
    fetchTodos();
  }, []);

  const createTable = () => {
    db.transaction((tx) => {
      tx.executeSql(
        "CREATE TABLE IF NOT EXISTS Todos (id INTEGER PRIMARY KEY AUTOINCREMENT, message TEXT, isDone INTEGER DEFAULT 0);"
      );
    });
  };

  const fetchTodos = () => {
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM Todos ORDER BY isDone ASC, id DESC;", // Önce yapılmayanlar, sonra yeniler
        [],
        (tx, results) => {
          const temp = [];
          for (let i = 0; i < results.rows.length; ++i) {
            temp.push(results.rows.item(i));
          }
          setTodos(temp);
        }
      );
    });
  };

  const handleSaveTodo = () => {
    if (!todoText.trim()) {
      return; // Boşsa hiçbir şey yapma, sessizce geç
    }

    if (editingId) {
      db.transaction((tx) => {
        tx.executeSql(
          "UPDATE Todos set message=? where id=?;",
          [todoText, editingId],
          (tx, results) => {
            if (results.rowsAffected > 0) {
              setEditingId(null);
              setTodoText('');
              fetchTodos();
            }
          }
        );
      });
    } else {
      db.transaction((tx) => {
        tx.executeSql(
          "INSERT INTO Todos (message, isDone) VALUES (?, 0);",
          [todoText],
          (tx, results) => {
            if (results.rowsAffected > 0) {
              setTodoText('');
              fetchTodos();
            }
          }
        );
      });
    }
  };

  const toggleTodoStatus = (item) => {
    const newStatus = item.isDone === 0 ? 1 : 0;
    db.transaction((tx) => {
      tx.executeSql(
        "UPDATE Todos set isDone=? where id=?;",
        [newStatus, item.id],
        (tx, results) => {
          if (results.rowsAffected > 0) {
            fetchTodos();
          }
        }
      );
    });
  };

  const deleteTodo = (id) => {
    db.transaction((tx) => {
      tx.executeSql(
        "DELETE FROM Todos where id=?;",
        [id],
        (tx, results) => {
          if (results.rowsAffected > 0) {
            fetchTodos();
          }
        }
      );
    });
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setTodoText(item.message);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      <Text style={styles.headerTitle}>Görevlerim</Text>

      {/* Modern, Yan Yana Ekleme Alanı */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Yeni bir görev ekle..."
          placeholderTextColor="#888"
          value={todoText}
          onChangeText={setTodoText}
        />
        <TouchableOpacity 
          style={[styles.addButton, editingId && styles.updateButton]} 
          onPress={handleSaveTodo}
        >
          <Text style={styles.addButtonText}>
            {editingId ? '✓' : '+'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={todos}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.todoCard, item.isDone === 1 && styles.todoCardDone]}>
            
            {/* Özel Tasarım Checkbox */}
            <TouchableOpacity 
              style={[styles.checkbox, item.isDone === 1 && styles.checkboxChecked]} 
              onPress={() => toggleTodoStatus(item)}
            >
              {item.isDone === 1 && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>

            {/* Görev Metni */}
            <View style={styles.textContainer}>
              <Text style={[styles.todoText, item.isDone === 1 && styles.todoTextDone]}>
                {item.message}
              </Text>
            </View>
            
            {/* Düzenle ve Sil Butonları (Modern Görünüm) */}
            <View style={styles.actionButtons}>
              {item.isDone === 0 && (
                <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
                  <Text style={styles.editText}>Düzenle</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => deleteTodo(item.id)} style={styles.actionBtn}>
                <Text style={styles.deleteText}>Sil</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Yapılacak hiçbir şey yok. Harika!</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Karanlık arka plan
    paddingTop: 60,
    paddingHorizontal: 25,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  input: {
    flex: 1,
    backgroundColor: '#1E1E1E', // Hafif açık koyu gri
    color: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    marginRight: 15,
  },
  addButton: {
    backgroundColor: '#0A84FF', // iOS Mavisi
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0A84FF',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  updateButton: {
    backgroundColor: '#32D74B', // Yeşil güncelleme rengi
    shadowColor: '#32D74B',
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
  },
  todoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E', // Kart rengi
    padding: 18,
    borderRadius: 16,
    marginBottom: 15,
  },
  todoCardDone: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0A84FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  checkboxChecked: {
    backgroundColor: '#0A84FF',
    borderColor: '#0A84FF',
  },
  checkmark: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
  },
  todoText: {
    fontSize: 16,
    color: '#E0E0E0',
    fontWeight: '500',
  },
  todoTextDone: {
    color: '#666666',
    textDecorationLine: 'line-through',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    paddingLeft: 12,
    paddingVertical: 5,
  },
  editText: {
    color: '#0A84FF',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteText: {
    color: '#FF453A', // iOS Kırmızı
    fontSize: 13,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#555',
    marginTop: 40,
    fontSize: 16,
  }
});