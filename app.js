import express from 'express'
import getTrains from './src/getTrains'

const app = express()
app.set('view engine', 'ejs')

const config = {
  port: process.env.PORT || 3000
}

app.get('/', (req, res) => {
  res.send({data: 'hello'})
})

app.get('/api/destinations/:from/:year/:month/:day', async (req, res, next) => {
  const date = req.params.year + '-' + req.params.month + '-' + req.params.day
  try {
    const data = await getTrains(req.params.from, date, 100, req.query.p)
    let trains = data.routes.map(dest => dest.trains.map(t => ({ d: t.departureTime, a: t.arrivalTime, n: dest.destination }))).flat().sort((a, b) => new Date(date + 'T' + a.d).getTime() - new Date(date + 'T' + b.d).getTime())
    trains = Object.fromEntries(trains.map(t => ([`${t.d} - ${t.a}`, t.n])))
    res.json(trains)
  } catch (e) {
    next(e)
  }
})

app.get('/destinations/:from/:year/:month/:day', async (req, res, next) => {
  const date = req.params.year + '-' + req.params.month + '-' + req.params.day
  try {
    const data = await getTrains(req.params.from, date, 100, req.query.p)
    let trains = data.routes.map(dest => dest.trains.map(t => {
      const departure = new Date(date + 'T' + t.departureTime)
      const arrival = new Date(date + 'T' + t.arrivalTime)
      if (arrival.getTime() < departure.getTime()) arrival.setDate(arrival.getDate() + 1)

      return {
        departure,
        arrival,
        from: req.params.from,
        to: dest.destination,
        train: t.id
      }
    })).flat().sort((a, b) => a.departure.getTime() - b.departure.getTime())

    const page = parseInt(req.query.p || 0)
    const lastPage = Math.floor(data.total_count / 100)

    res.render('destinations', {
      trains,
      page,
      lastPage
    });
  } catch (e) {
    next(e)
  }
})

app.listen(config.port, () => console.log(`Server listening on localhost:${config.port}`))
