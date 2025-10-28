const { ValidationError } = require('../../../lib/errors')

async function tagForUserMustBeUnique({ tagRepository }, { id, userId, name }) {
  const exists = await tagRepository.exists({
    options: {
      where: {
        user_id: userId,
        name,
        id: { not: id, _condition: id != null }
      }
    }
  })
  if (exists) {
    throw new ValidationError('Tag name must be unique for user')
  }
}

async function userMustOwnTheTag({ tagRepository }, { id, userId }) {
  const exists = await tagRepository.exists({
    options: {
      where: { id, user_id: userId }
    }
  })
  if (!exists) {
    throw new ValidationError('User does not own this tag')
  }
}

async function userMustOwnTheTags({ tagRepository }, { tagIds, userId }) {
  if (tagIds.length === 0) {
    return
  }

  const { filtered: count } = await tagRepository.count({
    options: {
      where: {
        id: { in: tagIds },
        user_id: userId
      },
      counts: {
        filtered: true
      }
    }
  })

  if (count !== tagIds.length) {
    throw new ValidationError('User does not own all the tags')
  }
}

module.exports = {
  tagForUserMustBeUnique,
  userMustOwnTheTag,
  userMustOwnTheTags
}
