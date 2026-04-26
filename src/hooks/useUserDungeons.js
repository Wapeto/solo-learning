import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export function useUserDungeons(userId) {
  const [userDungeons, setUserDungeons] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId) { setUserDungeons([]); return }
    setLoading(true)
    supabase
      .from('user_dungeons')
      .select('*')
      .eq('user_id', userId)
      .then(({ data, error }) => {
        if (!error && data) {
          setUserDungeons(data.map(row => ({ ...row.dungeon_data, _supabaseId: row.id, _isUserDungeon: true })))
        }
        setLoading(false)
      })
  }, [userId])

  async function uploadDungeon(dungeonJson) {
    if (!userId) throw new Error('Not authenticated')
    if (
      typeof dungeonJson.id !== 'string' || !dungeonJson.id ||
      typeof dungeonJson.title !== 'string' || !dungeonJson.title ||
      typeof dungeonJson.rank !== 'string' || !dungeonJson.rank ||
      !Array.isArray(dungeonJson.floors) || dungeonJson.floors.length === 0
    ) {
      throw new Error('Invalid dungeon: must have id (string), title (string), rank (string), and at least one floor.')
    }
    const { data, error } = await supabase
      .from('user_dungeons')
      .insert({ user_id: userId, dungeon_data: dungeonJson })
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    const newEntry = { ...dungeonJson, _supabaseId: data.id, _isUserDungeon: true }
    setUserDungeons(prev => [...prev, newEntry])
    return data.id
  }

  async function deleteDungeon(supabaseId) {
    const { error } = await supabase
      .from('user_dungeons')
      .delete()
      .eq('id', supabaseId)
      .eq('user_id', userId)
    if (error) throw new Error(error.message)
    setUserDungeons(prev => prev.filter(d => d._supabaseId !== supabaseId))
  }

  function getShareUrl(supabaseId) {
    return `https://solo-learning.wapeto.net/dungeon/${supabaseId}`
  }

  async function fetchPublicDungeon(supabaseId) {
    const { data, error } = await supabase
      .from('user_dungeons')
      .select('*')
      .eq('id', supabaseId)
      .single()
    if (error || !data) return null
    return { ...data.dungeon_data, _supabaseId: data.id, _isUserDungeon: true }
  }

  async function importDungeon(supabaseId) {
    const alreadyHave = userDungeons.some(d => d._supabaseId === supabaseId)
    if (alreadyHave) return
    const dungeonData = await fetchPublicDungeon(supabaseId)
    if (!dungeonData) throw new Error('Dungeon not found')
    await uploadDungeon(dungeonData)
  }

  return { userDungeons, loading, uploadDungeon, deleteDungeon, getShareUrl, importDungeon, fetchPublicDungeon }
}
