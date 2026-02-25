import { db } from './src/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
const users = await getDocs(collection(db, 'users'));
users.forEach(doc => {
  const data = doc.data();
  if (data.role === 'admin' || data.role === 'super_admin' || data.adminRole) {
    console.log(doc.id, data.name, data.email, data.role, data.adminRole);
  }
});
