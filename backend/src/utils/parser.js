function parseLine(line) {

    const parts = line.split("|");
  
    if (parts.length !== 6) {
      throw new Error("Malformed line");
    }
  
    const [
      event_id,
      event_name,
      start_date,
      end_date,
      parent_id,
      description
    ] = parts;
  
    const start = new Date(start_date);
    const end = new Date(end_date);
  
    if (isNaN(start) || isNaN(end)) {
      throw new Error("Invalid date format");
    }
  
    const duration =
      Math.floor((end - start) / 60000);
  
    return {
      event_id,
      event_name,
      description,
      start_date: start,
      end_date: end,
      parent_event_id: parent_id === "NULL" ? null : parent_id,
      duration_minutes: duration
    };
  
  }
  
  module.exports = { parseLine };