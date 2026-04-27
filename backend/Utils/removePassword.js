exports.removePassword = (obj) => {
  const newObj = { ...obj }; // Create a copy of the object

  // Check if the object has a 'password' field
  if ("password" in newObj) {
    // Delete the 'password' field
    delete newObj["password"];
  }

  return newObj;
};
