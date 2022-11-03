import axios from 'axios'

export default async function getTrains (from, date, results = 10, page = 0) {
  const url = new URL('https://ressources.data.sncf.com/api/v2/catalog/datasets/tgvmax/records')
  url.searchParams.set('where', `od_happy_card like "oui" AND date = date'${date}' AND origine like "${from}"`)
  url.searchParams.set('limit', results)
  url.searchParams.set('order_by', 'heure_depart')
  url.searchParams.set('offset', page * results)
  url.searchParams.set('timezone', 'UTC')

  console.log(url.href)

  const { data } = await axios.get(url.href)

  const records = data.records.map(({ record: { fields } }) => ({
    destination: fields.destination,
    origine: fields.origine,
    departureTime: fields.heure_depart,
    arrivalTime: fields.heure_arrivee,
    train: fields.train_no
  }))

  const routes = records.reduce((unique, record) => {
    if (unique.map(u => u.destination).includes(record.destination)) {
      return unique.map(route => {
        if (route.destination === record.destination) {
          const newRoute = route
          newRoute.trains.push({
            id: record.train,
            departureTime: record.departureTime,
            arrivalTime: record.arrivalTime
          })
          return newRoute
        }
        return route
      })
    } else {
      return [...unique, {
        destination: record.destination,
        trains: [{
          id: record.train,
          departureTime: record.departureTime,
          arrivalTime: record.arrivalTime
        }]
      }]
    }
  }, [])

  return { routes, total_count: data.total_count }
}
