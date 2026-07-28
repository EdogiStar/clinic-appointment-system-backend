const supabase = require("../config/supabase");

const getAllSpecialties = async () => {
  const { data, error } = await supabase
    .from("specialties")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

module.exports = {
  getAllSpecialties,
};