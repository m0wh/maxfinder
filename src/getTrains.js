import axios from 'axios'

export async function getTrains (from, to, date, results = 10, page = 0) {
  const url = new URL('https://ressources.data.sncf.com/api/v2/catalog/datasets/tgvmax/records')
  let where = `od_happy_card like "oui" AND date = date'${date}'`
  if (typeof from === 'string' && from.length > 0) where += `AND origine like "${from}" AND NOT destination like "${from}"`
  if (typeof to === 'string' && to.length > 0) where += `AND destination like "${to}" AND NOT origine like "${to}"`

  url.searchParams.set('where', where)
  url.searchParams.set('limit', results)
  url.searchParams.set('order_by', 'heure_depart,heure_arrivee')
  url.searchParams.set('offset', page * results)
  url.searchParams.set('timezone', 'UTC')

  console.log(url.href)

  const { data } = await axios.get(url.href)

  const records = data.records.map(({ record: { fields } }) => ({
    to: { iata: fields.destination_iata, name: fields.destination },
    from: { iata: fields.origine_iata, name: fields.origine },
    departure: new Date(date + 'T' + fields.heure_depart),
    arrival: new Date(date + 'T' + fields.heure_arrivee),
    train_no: fields.train_no
  }))

  return { trains: records, total_count: data.total_count }
}

export async function getAllTrains (from, to, date) {
  const trains = []
  const data = await getTrains(from, to, date, 100, 0)
  trains.push(...data.trains)

  const numberOfPages = Math.floor(data.total_count / 100) + 1
  console.log(numberOfPages)
  for (let i = 1; i < numberOfPages; i++) {
    const d = await getTrains(from, to, date, 100, i)
    trains.push(...d.trains)
  }

  return { trains, total_count: data.total_count }
}
