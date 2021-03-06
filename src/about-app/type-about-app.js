// @flow
import type { ReactNavigation } from '../common/type-common'

export type AboutAppProps = {
  environmentName: string,
} & ReactNavigation

export type AboutAppListItemProps = {
  onPress: () => void,
  titleValue: string,
}
