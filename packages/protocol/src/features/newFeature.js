import { useEffect } from 'react';
import axios from 'axios';

const NewFeature = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchNewData();
  }, []);

  const fetchNewData = async () => {
    try {
      const response = await axios.get('https://api.example.com/data');
      setData(response.data);
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  };

  return (
    <div>
      {data.map(item => (
        <p key={item.id}>{item.name}</p>
      ))}
    </div>
  );
};

export default NewFeature;
