import {
  changePasswordDescription,
  findPasswordDetail,
  searchPassword,
} from '@/model/password'
import { useDescription } from '@/storage/description'
import { GetPromiseReturns } from '@/types/utils'

import {
  Button,
  Descriptions,
  DescriptionsItem,
  Form,
  FormItem,
  Input,
  message,
} from 'ant-design-vue'
import { EditOutlined } from '@ant-design/icons-vue'
import { defineComponent, reactive, ref, watch, nextTick } from 'vue'
import ViewIcon from '@/icons/view.vue'
import ViewCloseIcon from '@/icons/viewClose.vue'
import { decodeAes } from '@/utils/crypto'
import * as electron from 'electron'
import { EditIcon } from '@/icons'
import { IEvent } from '@/types/common'
const { clipboard } = electron

export default defineComponent({
  name: 'passwordDescription',
  setup() {
    const columns = [
      { label: 'username', key: 'username' },
      { label: 'password', key: 'password' },
      { label: 'website', key: 'url' },
      { label: 'description', key: 'description' },
    ] as const

    const changeInputRef = ref<any | null>(null)

    const requiredField = ['username', 'password']
    const { activeDescription } = useDescription()
    const description = reactive({
      data: {} as GetPromiseReturns<typeof findPasswordDetail>,
      password: '',
      editKey: null as null | string,
      editValue: '',
    })
    async function getData() {
      handleRemovePassword()
      const id = Number(activeDescription.value)
      if (id) {
        const data = await findPasswordDetail(id)
        if (data) description.data = data
      }
    }

    async function handleSearchPassword(id: number) {
      const result = await searchPassword(id)
      if (result && result.password) {
        const code = await decodeAes(result.password)
        if (code) description.password = code
      }
    }
    function handleRemovePassword() {
      description.password = ''
    }
    watch(
      () => activeDescription.value,
      () => {
        getData()
      }
    )

    const handleCopyPassword = async (key: string) => {
      if (key === 'password') {
        const pwd = description.password
        if (!pwd) {
          await handleSearchPassword(description.data!.id)
        }
        clipboard.writeText(description.password)
        message.success('🎉 copy password to clipboard success')
        description.password = pwd
      }
    }

    const handleEditPasswordDescription = (field: string) => {
      description.editKey = field
      description.editValue = Reflect.get(description.data!, field)
      nextTick(() => changeInputRef.value?.focus())
    }
    const handleEditBlur = () => {
      description.editKey = null
      description.editValue = ''
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        handleEditBlur
      } else if (e.code === 'Enter') {
        handleEditDescription()
        handleEditBlur()
      }
    }

    const handleEditDescription = async () => {
      if (!description.editKey) return
      const isRequired = requiredField.includes(description.editKey)
      if (isRequired) {
        if (!description.editValue.trim()) {
          message.error('required field')
          return
        }
      }
      const changeField = { [description.editKey]: description.editValue }
      await changePasswordDescription(
        Number(activeDescription.value),
        changeField
      )
      message.success('🎉 change success')
      getData()
    }
    return () => {
      if (!activeDescription.value) return null
      // <div class="min-w-0 p-x-2 overflow-hidden">
      //   <Descriptions column={1}
      //     style={{ margin: '12px', border:'1px solid var(--box-color-1)', position: 'relative'}}
      //     layout="vertical"
      //   >
      //     {activeDescription.value &&
      //       description.data?.id &&
      //       columns.map((column) => {
      //         const key = column.key as (typeof columns)[number]['key']
      //         const isPasswordField = key === 'password'
      //         return (
      //           <DescriptionsItem
      //             id={column.key}
      //             label={column.label}
      //             style={{ padding: '20px'}}
      //           >
      //            <div>
      //               {description.editKey !== column.key ? (
      //                 <div
      //                   class={
      //                     'whitespace-nowrap text-ellipsis flex-1 p-r-12 h-full description-item' +
      //                     (isPasswordField ? ' cursor-pointer' : '')
      //                   }
      //                 >
      //                   <span
      //                     onClick={() => handleCopyPassword(key)}
      //                     class="relative"
      //                   >
      //                     {isPasswordField
      //                       ? description.password || passwordLabel
      //                       : description.data![key]}
      //                   </span>
      //                   <EditIcon
      //                     class={
      //                       'absolute right-6 description-item__field m-l-1 align-middle'
      //                     }
      //                     onClick={() => {
      //                       handleEditPasswordDescription(column.key)
      //                     }}
      //                   />
      //                   {isPasswordField && (
      //                     <span class="absolute right-0 select-none">
      //                       {description.password ? (
      //                         <span onClick={handleRemovePassword}>
      //                           <ViewCloseIcon />
      //                         </span>
      //                       ) : (
      //                         <span
      //                           onClick={() =>
      //                             handleSearchPassword(description.data!.id)
      //                           }
      //                         >
      //                           <ViewIcon />
      //                         </span>
      //                       )}
      //                     </span>
      //                   )}
      //                 </div>
      //               ) : (
      //                 <div onKeydown={handleKeyDown}>
      //                   <Input
      //                     ref={e => changeInputRef.value = e}
      //                     onBlur={handleEditBlur}
      //                     value={description.editValue}
      //                     onChange={(e: IEvent<HTMLInputElement>) =>
      //                       (description.editValue = e.target.value)
      //                     }
      //                     style={{ width: '80%' }}
      //                   />
      //                 </div>
      //               )}
      //            </div>
      //           </DescriptionsItem>
      //         )
      //       })}
      //   </Descriptions>
      // </div>

      return (
        <div>
          <div class="flex justify-between">
            <div></div>
            <div>
              <Button icon={<EditOutlined />} type="text">
                Edit
              </Button>
            </div>
          </div>
          <div class="m-6 leading-5">
            <h3>{Reflect.get(description.data!, 'title')}</h3>
            <div class={'border-ins border-solid border-1px rounded m-y-6'}>
              {columns.map((column, index) => {
                const key = column.key as (typeof columns)[number]['key']
                const isPasswordField = key === 'password'
                const isLastIndex = index === columns.length - 1
                return (
                  <div
                    key={key}
                    class={
                      (isLastIndex
                        ? ''
                        : 'border-b-1px border-b-solid border-b-ins ') + 'p-3'
                    }
                  >
                    <div>{column.label}</div>
                    <Input
                      style={{
                        padding: 0,
                        color: 'inherit',
                        cursor: 'default',
                      }}
                      value={Reflect.get(description.data!, key)}
                      type={isPasswordField ? 'password' : 'default'}
                      bordered={false}
                      disabled
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )
    }
  },
})
