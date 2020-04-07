import { connectToDatabase } from '../config'

const knex = connectToDatabase()

export function getDatabase() {
  return knex
}

export async function setSerializable() {
  await knex.raw('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;')
}
