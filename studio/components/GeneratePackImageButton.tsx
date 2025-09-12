// studio/components/GeneratePackImageButton.tsx
import React, {useState, useCallback} from 'react'
import {Button, Spinner, Card, Text, Stack} from '@sanity/ui'
import {useFormValue, useClient, SanityDocument} from 'sanity'
import {nanoid} from 'nanoid'

export const GeneratePackImageButton = (props) => {
  const {onChange} = props
  const document = useFormValue([]) as SanityDocument
  const client = useClient({apiVersion: '2024-01-01'})

  const [loading, setLoading] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)

  const handleGenerate = useCallback(async () => {
    if (!document?._id) return

    setLoading(true)
    setGeneratedImage(null)
    try {
      const response = await fetch(`/api/generate-image?packId=${document._id}`)
      const result = await response.json()

      if (result.ok && result.base64) {
        setGeneratedImage(result.base64)
      } else {
        throw new Error(result.error || 'La génération a échoué.')
      }
    } catch (error) {
      alert(`Erreur : ${error.message}`)
    } finally {
      setLoading(false)
    }
  }, [document])

  const handleSelectImage = useCallback(async (base64: string) => {
    setLoading(true)
    try {
      const imageBlob = await (await fetch(`data:image/webp;base64,${base64}`)).blob()
      const uploadedAsset = await client.assets.upload('image', imageBlob, {
        filename: `${document.slug?.current || 'pack'}-${nanoid()}.webp`,
      })

      const patch = {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: uploadedAsset._id,
        },
      }

      onChange({type: 'set', path: [], value: patch})
      setGeneratedImage(null)
    } catch (error) {
      alert(`Erreur lors de l'import de l'image : ${error.message}`)
    } finally {
      setLoading(false)
    }
  }, [client, document, onChange])

  if (document?.type !== 'pack') {
    return null
  }

  return (
    <Stack space={3} marginTop={4}>
      <Card border radius={2} padding={3} tone="primary">
        <Stack space={3}>
          <Text weight="semibold">Génération d'image pour le pack</Text>
          <Button onClick={handleGenerate} text="Générer l'image par IA" tone="primary" disabled={loading} />
        </Stack>
      </Card>
      {loading && <Card padding={3}><Text align="center"><Spinner /></Text></Card>}
      {generatedImage && (
        <Card padding={2} shadow={1} tone="positive">
          <img src={`data:image/webp;base64,${generatedImage}`} alt="Preview" style={{width: '100%', marginTop: '10px', borderRadius: '3px'}} />
          <Stack marginTop={3}>
            <Button text="Utiliser cette image" tone="positive" onClick={() => handleSelectImage(generatedImage)} disabled={loading} />
          </Stack>
        </Card>
      )}
    </Stack>
  )
}
